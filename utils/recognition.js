const BEER_LABEL_MODEL = "glm-5v-turbo";
const CLOUD_ENV_ID = "beer-cellar-prod-d7ew43z02bc0263";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_INLINE_PAYLOAD_LENGTH = 4.2 * 1024 * 1024;
const RECOGNITION_TIMEOUT_MS = 45000;
const TEMP_CLOUD_DIRECTORY = "recognition-temp";
let temporaryCloudStorageUnavailable = false;

function createRecognitionError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function buildSafeDiagnostic(error) {
  const errCode = error && (error.errCode !== undefined ? error.errCode : error.code);
  const errMsg = normalizeText(error && (error.errMsg || error.message));
  return `${errCode === undefined ? "" : errCode} ${errMsg}`
    .replace(/sk-[A-Za-z0-9_-]+/g, "密钥已隐藏")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function normalizeCloudCallError(error) {
  const errCode = error && (error.errCode !== undefined ? error.errCode : error.code);
  const errMsg = normalizeText(error && (error.errMsg || error.message));
  const searchable = `${errCode === undefined ? "" : errCode} ${errMsg}`.toLowerCase();
  let code = "CLOUD_CALL_FAILED";
  let message = "微信云开发调用失败";

  if (/timeout|timed out|超时/.test(searchable)) {
    code = "AI_TIMEOUT";
    message = "酒标识别超时";
  } else if (/network|request:fail|connection|socket|dns|网络/.test(searchable)) {
    code = "NETWORK_FAILED";
    message = "网络没有连接到识别服务";
  } else if (
    /not authorized|unauthorized|permission|access denied|forbidden|auth fail|invalid appid|未授权|无权限|授权失败/.test(searchable)
  ) {
    code = "CLOUD_ACCESS_DENIED";
    message = "小程序尚未获得云开发访问权限";
  } else if (
    /environment|env id|cloud development|cloud resource|not initialized|not found|not exist|未开通云开发|环境不存在|找不到环境|资源未初始化/.test(searchable)
  ) {
    code = "CLOUD_ENV_UNAVAILABLE";
    message = "小程序尚未连通云开发环境";
  }

  const nextError = createRecognitionError(code, message);
  nextError.errCode = errCode;
  nextError.errMsg = errMsg;
  nextError.diagnostic = buildSafeDiagnostic(error);
  nextError.cause = error;
  return nextError;
}

function normalizeText(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

function normalizeDate(value) {
  const text = normalizeText(value);
  const match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!match) return "";
  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}-${String(Number(match[3])).padStart(2, "0")}`;
}

function normalizeSizeUnit(value) {
  const text = normalizeText(value).toLowerCase().replace(/\s+/g, " ");
  const aliases = {
    ml: "ml",
    毫升: "ml",
    l: "L",
    升: "L",
    cl: "cl",
    厘升: "cl",
    pint: "pint",
    品脱: "pint",
    "fl oz": "fl oz",
    floz: "fl oz",
    oz: "oz",
    盎司: "oz",
    gal: "gal",
    gallon: "gal",
    加仑: "gal"
  };
  return aliases[text] || "";
}

function extractJson(text) {
  if (text && typeof text === "object" && !Array.isArray(text)) return text;
  const content = Array.isArray(text)
    ? text.map((item) => item && (item.text || item.output_text || item.content || "")).join("\n")
    : text;
  const source = normalizeText(content)
    .replace(/^\uFEFF/, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .replace(/[“”]/g, "\"");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw createRecognitionError("INVALID_RESULT", "识别结果不是有效 JSON");
  }
  const jsonSource = source.slice(start, end + 1);
  try {
    return JSON.parse(jsonSource);
  } catch (error) {
    try {
      return JSON.parse(jsonSource.replace(/,\s*([}\]])/g, "$1"));
    } catch (repairError) {
      throw createRecognitionError("INVALID_RESULT", "识别结果无法解析");
    }
  }
}

function normalizeRecognitionResult(value) {
  const raw = value && typeof value === "object" ? value : {};
  const confidence = Number(raw.confidence);
  return {
    name: normalizeText(raw.name),
    brewery: normalizeText(raw.brewery),
    style: normalizeText(raw.style),
    hops: normalizeText(raw.hops),
    sizeAmount: normalizeText(raw.sizeAmount).replace(/[^\d.]/g, ""),
    sizeUnit: normalizeSizeUnit(raw.sizeUnit),
    packagedDate: normalizeDate(raw.packagedDate),
    bestBeforeDate: normalizeDate(raw.bestBeforeDate),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.map(normalizeText).filter(Boolean).slice(0, 4)
      : []
  };
}

function inferImageMimeType(filePath) {
  const lowerPath = normalizeText(filePath).toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function readImageAsDataUrl(filePath) {
  const fileSystem = wx.getFileSystemManager();
  return new Promise((resolve, reject) => {
    const readFile = () => {
      fileSystem.readFile({
        filePath,
        encoding: "base64",
        success: (result) => {
          resolve(`data:${inferImageMimeType(filePath)};base64,${result.data}`);
        },
        fail: () => reject(createRecognitionError("READ_FAILED", "无法读取酒标照片"))
      });
    };
    if (!fileSystem.getFileInfo) {
      readFile();
      return;
    }
    fileSystem.getFileInfo({
      filePath,
      success: (result) => {
        if (Number(result.size || 0) > MAX_IMAGE_BYTES) {
          reject(createRecognitionError("IMAGE_TOO_LARGE", "单张酒标照片不能超过 5MB"));
          return;
        }
        readFile();
      },
      fail: () => reject(createRecognitionError("READ_FAILED", "无法读取酒标照片"))
    });
  });
}

function compressImageForInlineTransfer(filePath) {
  if (!wx.compressImage) return Promise.resolve(filePath);
  return new Promise((resolve) => {
    wx.compressImage({
      src: filePath,
      quality: 55,
      compressedWidth: 1280,
      compressedHeight: 1280,
      success: (result) => resolve(result.tempFilePath || filePath),
      fail: () => resolve(filePath)
    });
  });
}

async function prepareInlineImages(paths, options) {
  const imageUrls = [];
  for (let index = 0; index < paths.length; index += 1) {
    reportProgress(options, "compressing", {
      current: index + 1,
      total: paths.length
    });
    const compressedPath = await compressImageForInlineTransfer(paths[index]);
    imageUrls.push(await readImageAsDataUrl(compressedPath));
  }
  const payloadLength = imageUrls.reduce((total, imageUrl) => total + imageUrl.length, 0);
  if (payloadLength > MAX_INLINE_PAYLOAD_LENGTH) {
    throw createRecognitionError("IMAGES_TOO_LARGE", "压缩后的酒标照片仍然过大");
  }
  return imageUrls;
}

function reportProgress(options, stage, detail) {
  if (options && typeof options.onProgress === "function") {
    options.onProgress({ stage, ...(detail || {}) });
  }
}

function getFileExtension(filePath) {
  const match = normalizeText(filePath).toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  const extension = match && match[1];
  return ["jpg", "jpeg", "png", "webp"].includes(extension) ? extension : "jpg";
}

function createCloudPath(filePath, index) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${TEMP_CLOUD_DIRECTORY}/${Date.now()}-${random}-${index + 1}.${getFileExtension(filePath)}`;
}

function uploadCloudFile(filePath, index) {
  return wx.cloud.uploadFile({
    cloudPath: createCloudPath(filePath, index),
    filePath
  }).then((result) => {
    if (!result || !result.fileID) {
      throw createRecognitionError("UPLOAD_FAILED", "酒标照片上传失败");
    }
    return result.fileID;
  }).catch((error) => {
    if (error && error.code === "UPLOAD_FAILED") throw error;
    const nextError = createRecognitionError("UPLOAD_FAILED", "酒标照片上传失败");
    nextError.diagnostic = buildSafeDiagnostic(error);
    nextError.cause = error;
    throw nextError;
  });
}

async function uploadRecognitionImages(paths, options) {
  const fileIDs = [];
  try {
    for (let index = 0; index < paths.length; index += 1) {
      reportProgress(options, "uploading", {
        current: index + 1,
        total: paths.length
      });
      fileIDs.push(await uploadCloudFile(paths[index], index));
    }
  } catch (error) {
    await deleteTemporaryCloudFiles(fileIDs);
    throw error;
  }

  let response;
  try {
    response = await wx.cloud.getTempFileURL({ fileList: fileIDs });
  } catch (error) {
    await deleteTemporaryCloudFiles(fileIDs);
    const nextError = createRecognitionError("TEMP_URL_FAILED", "无法准备酒标照片");
    nextError.diagnostic = buildSafeDiagnostic(error);
    nextError.cause = error;
    throw nextError;
  }
  const imageUrls = (response && response.fileList || []).map((item) => {
    if (!item || Number(item.status || 0) !== 0 || !item.tempFileURL) return "";
    return item.tempFileURL;
  });
  if (imageUrls.length !== fileIDs.length || imageUrls.some((url) => !url)) {
    await deleteTemporaryCloudFiles(fileIDs);
    throw createRecognitionError("TEMP_URL_FAILED", "无法准备酒标照片");
  }
  return { fileIDs, imageUrls };
}

function deleteTemporaryCloudFiles(fileIDs) {
  if (!fileIDs.length || !wx.cloud || !wx.cloud.deleteFile) return Promise.resolve();
  return wx.cloud.deleteFile({ fileList: fileIDs }).catch(() => undefined);
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(createRecognitionError("AI_TIMEOUT", "酒标识别超时"));
    }, timeoutMs);
    promise.then((result) => {
      clearTimeout(timer);
      resolve(result);
    }).catch((error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function recognizeBeerLabels(filePaths, options) {
  const paths = (filePaths || []).filter(Boolean).slice(0, 2);
  if (!paths.length) {
    throw createRecognitionError("NO_IMAGE", "请先拍摄酒标");
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    throw createRecognitionError("AI_UNAVAILABLE", "当前基础库不支持云开发能力");
  }

  const prefersTemporaryCloudFiles = !options || options.preferCloudStorage !== false;
  const supportsTemporaryCloudFiles = prefersTemporaryCloudFiles && !temporaryCloudStorageUnavailable && Boolean(
    wx.cloud.uploadFile
    && wx.cloud.getTempFileURL
    && wx.cloud.deleteFile
  );
  let temporaryFileIDs = [];
  let imageUrls;
  let usesRemoteImageUrls = false;
  let fallbackDiagnostic = "";
  if (supportsTemporaryCloudFiles) {
    try {
      const uploadResult = await uploadRecognitionImages(paths, options);
      temporaryFileIDs = uploadResult.fileIDs;
      imageUrls = uploadResult.imageUrls;
      usesRemoteImageUrls = true;
    } catch (error) {
      await deleteTemporaryCloudFiles(temporaryFileIDs);
      if (!error || !["UPLOAD_FAILED", "TEMP_URL_FAILED"].includes(error.code)) throw error;
      temporaryCloudStorageUnavailable = true;
      fallbackDiagnostic = error.diagnostic || buildSafeDiagnostic(error.cause || error);
      imageUrls = await prepareInlineImages(paths, options);
    }
  } else {
    imageUrls = await prepareInlineImages(paths, options);
  }

  reportProgress(options, "recognizing", { current: paths.length, total: paths.length });
  let response;
  try {
    response = await withTimeout(wx.cloud.callFunction({
      name: "recognizeBeerLabel",
      config: { env: CLOUD_ENV_ID },
      data: usesRemoteImageUrls ? { imageUrls } : { images: imageUrls }
    }), RECOGNITION_TIMEOUT_MS);
  } catch (error) {
    if (error && error.code === "AI_TIMEOUT") throw error;
    const nextError = normalizeCloudCallError(error);
    if (fallbackDiagnostic) {
      nextError.diagnostic = `上传 ${fallbackDiagnostic}；调用 ${nextError.diagnostic || "失败"}`.slice(0, 140);
    }
    throw nextError;
  } finally {
    await deleteTemporaryCloudFiles(temporaryFileIDs);
  }

  const cloudResult = response && response.result;
  if (!cloudResult || cloudResult.ok !== true) {
    const errorCode = cloudResult && cloudResult.code;
    const nextError = createRecognitionError(errorCode || "AI_REQUEST_FAILED", cloudResult && cloudResult.message);
    const diagnosticParts = [
      usesRemoteImageUrls ? "临时云文件" : "压缩图片",
      cloudResult && cloudResult.statusCode ? `上游状态 ${cloudResult.statusCode}` : "",
      cloudResult && cloudResult.requestId ? `请求 ${String(cloudResult.requestId).slice(0, 36)}` : ""
    ].filter(Boolean);
    nextError.diagnostic = diagnosticParts.join(" · ").slice(0, 140);
    throw nextError;
  }
  const responseValue = cloudResult.data || cloudResult.text;
  if (!responseValue) {
    throw createRecognitionError("EMPTY_RESULT", "识别服务没有返回内容");
  }
  const result = normalizeRecognitionResult(extractJson(responseValue));
  if (!result.name && !result.brewery) {
    throw createRecognitionError("NO_BEER_FOUND", "没有识别到明确的啤酒信息");
  }
  return result;
}

module.exports = {
  BEER_LABEL_MODEL,
  extractJson,
  normalizeCloudCallError,
  normalizeRecognitionResult,
  recognizeBeerLabels
};

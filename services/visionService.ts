import { PersonProfile, FaceDetection } from "../types";

/**
 * REAL AI VISION ENGINE (Powered by face-api.js)
 * 真实 AI 视觉引擎 (基于 face-api.js / TensorFlow.js)
 */

declare const faceapi: any; // Global from CDN (in index.html) / 来自 CDN 的全局变量

let isCriticalModelsLoaded = false;
let isDemographicsLoaded = false; // Flag for optional models / 可选模型加载标记
let faceMatcher: any = null;

// Cache state to prevent rebuilding Matcher every frame
// 缓存状态，防止每帧都重建匹配器
let lastDescriptorCount = -1;

// Configuration / 配置项
const CONFIG = {
  // Use jsDelivr CDN for GitHub Master branch to ensure all models (including age/gender) are available.
  // The previous URL (GitHub Pages) was missing the age_gender_model weights.
  // 使用 jsDelivr CDN 获取 GitHub Master 分支的权重，确保包含年龄/性别模型。
  MODEL_URL: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights',
};

/**
 * Load AI Models / 加载 AI 模型
 * Uses a "Safety-First" approach: Critical models must load, extras are optional.
 * 采用“安全优先”策略：核心模型必须加载，增强模型可选。
 */
export const loadModels = async (): Promise<boolean> => {
  if (isCriticalModelsLoaded) return true;

  try {
    console.log("Loading Critical Face Models... / 正在加载核心人脸模型...");
    
    // 1. CRITICAL: Detection, Landmarks, Recognition
    // 1. 核心：检测、关键点、识别
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(CONFIG.MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(CONFIG.MODEL_URL)
    ]);
    
    isCriticalModelsLoaded = true;
    console.log("Critical Models Loaded. / 核心模型加载完毕。");

    // 2. OPTIONAL: Demographics (Age, Gender, Expressions)
    // We try to load these, but if they fail, we don't crash the app.
    // 2. 可选：人口统计学（年龄、性别、表情）
    // 尝试加载这些模型，如果失败，不会导致应用崩溃。
    try {
        console.log("Loading Demographic Models... / 正在加载人口统计学模型...");
        await Promise.all([
            faceapi.nets.faceExpressionNet.loadFromUri(CONFIG.MODEL_URL),
            faceapi.nets.ageGenderNet.loadFromUri(CONFIG.MODEL_URL)
        ]);
        isDemographicsLoaded = true;
        console.log("Demographics Loaded. / 人口统计学模型加载完毕。");
    } catch (demoError) {
        console.warn("Demographics failed to load (Non-fatal). / 人口统计学模型加载失败 (非致命错误)", demoError);
        // Do not set isDemographicsLoaded to true
        isDemographicsLoaded = false;
    }

    return true;
  } catch (error) {
    console.error("CRITICAL: Failed to load core models / 致命错误: 核心模型加载失败:", error);
    return false;
  }
};

/**
 * Extract Feature Vector from an Image / 从图像提取特征向量
 */
export const extractFaceDescriptor = async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | null> => {
  if (!isCriticalModelsLoaded) await loadModels();

  const detection = await faceapi.detectSingleFace(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
};

/**
 * Build/Update the Face Matcher from Profiles
 * 根据用户档案构建或更新人脸匹配器
 */
const updateFaceMatcher = (profiles: PersonProfile[], threshold: number) => {
  const currentDescriptorCount = profiles.reduce((acc, p) => acc + p.descriptors.length, 0);
  
  if (currentDescriptorCount === lastDescriptorCount && faceMatcher) {
    return;
  }

  console.log(`Updating AI Matcher with ${currentDescriptorCount} vectors... / 正在使用 ${currentDescriptorCount} 个向量更新 AI 匹配器...`);

  const labeledDescriptors: any[] = [];

  profiles.forEach(p => {
    if (p.descriptors && p.descriptors.length > 0) {
        const vectors = p.descriptors.map(d => new Float32Array(d));
        labeledDescriptors.push(
            new faceapi.LabeledFaceDescriptors(p.name, vectors)
        );
    }
  });

  if (labeledDescriptors.length > 0) {
    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, threshold);
  } else {
    faceMatcher = null;
  }
  
  lastDescriptorCount = currentDescriptorCount;
};

/**
 * Real-time Face Detection & Recognition
 * 实时人脸检测与识别
 */
export const detectFacesReal = async (
  video: HTMLVideoElement,
  profiles: PersonProfile[],
  threshold: number = 0.55
): Promise<FaceDetection[]> => {
  
  if (!isCriticalModelsLoaded || !video || video.paused || video.ended) return [];

  // 1. Chain detection tasks based on available models
  // Only use models that successfully loaded
  // 1. 根据可用模型链接检测任务
  // 仅使用成功加载的模型
  let task = faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
  
  if (isDemographicsLoaded) {
      task = task.withFaceExpressions().withAgeAndGender();
  }

  const detections = await task;

  if (!detections.length) return [];

  // 2. Update Matcher (passing current threshold)
  // 2. 更新匹配器（传入当前阈值）
  updateFaceMatcher(profiles, threshold);

  // 3. Match
  // 3. 执行匹配
  const results: FaceDetection[] = detections.map((d: any) => {
    let name = "Unknown";
    let confidence = 0;
    let identified = false;

    if (faceMatcher) {
      // Find match
      // 查找最佳匹配
      const bestMatch = faceMatcher.findBestMatch(d.descriptor);
      
      // Manual Threshold Check
      // 手动阈值检查
      if (bestMatch.distance < threshold) {
        name = bestMatch.label;
        identified = true;
        const score = Math.max(0, 1 - (bestMatch.distance / threshold));
        confidence = Math.floor(score * 100); 
      } else {
         confidence = Math.floor((1 - Math.min(1, bestMatch.distance)) * 100); 
      }
    }

    // 4. Normalize Box
    // 4. 标准化边界框
    const box = d.detection.box; 
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const scaleX = 1000 / vW;
    const scaleY = 1000 / vH;

    // 5. Extract Demographics if available
    // 5. 提取人口统计学特征（如果可用）
    let age, gender, expressions;
    if (isDemographicsLoaded && d.age) {
        age = Math.round(d.age);
        gender = d.gender;
        expressions = d.expressions.asSortedArray();
    }

    return {
      identified,
      name,
      confidence,
      box_2d: [
        box.y * scaleY,
        box.x * scaleX,
        (box.y + box.height) * scaleY,
        (box.x + box.width) * scaleX
      ],
      age,
      gender,
      expressions
    };
  });

  return results;
};
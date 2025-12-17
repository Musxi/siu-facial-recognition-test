import { PersonProfile, FaceDetection } from "../types";

/**
 * REAL AI VISION ENGINE (Powered by face-api.js)
 * 真实AI视觉引擎 (基于 face-api.js / TensorFlow.js)
 * 
 * Logic Overview / 逻辑概览:
 * 1. Load Neural Networks (SSD MobileNet + ResNet-34) / 加载神经网络
 * 2. Detect Face & Landmarks / 检测人脸及关键点
 * 3. Extract 128-Dimension Feature Vector / 提取128维特征向量
 * 4. Calculate Euclidean Distance for Matching / 计算欧氏距离进行匹配
 */

declare const faceapi: any; // Global from CDN (in index.html)

let isModelLoaded = false;
let faceMatcher: any = null;

// Cache state to prevent rebuilding Matcher every frame
// 缓存状态，防止每帧都重新构建匹配器 (性能优化)
let lastDescriptorCount = -1;

// Configuration / 配置项
const CONFIG = {
  // Use public GitHub pages for model weights (High availability)
  // 模型权重文件地址 (使用 GitHub Pages 确保高可用性)
  MODEL_URL: 'https://justadudewhohacks.github.io/face-api.js/models',
  
  // Threshold for matching. Lower = stricter, Higher = looser.
  // 匹配阈值。0.6 是标准值。
  // 越低越严格（容易识别不出），越高越宽松（容易认错人）。
  // Recommended: 0.50 - 0.55 for strict security.
  DISTANCE_THRESHOLD: 0.55 
};

/**
 * Load AI Models / 加载 AI 模型
 * Loads the neural network weights into memory (GPU/WebGL acceleration enabled by default).
 * 将神经网络权重加载到内存中（默认开启 WebGL/GPU 加速）。
 */
export const loadModels = async (): Promise<boolean> => {
  if (isModelLoaded) return true;

  try {
    console.log("Loading Face Models... / 正在加载人脸模型...");
    
    // 1. Face Detection Model (Locates the face box)
    // 人脸检测模型：用于在图像中找到人脸的位置（画框）
    await faceapi.nets.ssdMobilenetv1.loadFromUri(CONFIG.MODEL_URL);
    
    // 2. Face Landmark Model (Aligns the face)
    // 人脸关键点模型：识别眼睛、鼻子、嘴巴的68个关键点，用于对齐人脸
    await faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.MODEL_URL);
    
    // 3. Face Recognition Model (Extracts vectors)
    // 人脸识别模型：将对齐后的人脸转换为128维数组（特征向量）
    await faceapi.nets.faceRecognitionNet.loadFromUri(CONFIG.MODEL_URL);
    
    isModelLoaded = true;
    console.log("Models Loaded Successfully / 模型加载成功");
    return true;
  } catch (error) {
    console.error("Failed to load models / 模型加载失败:", error);
    return false;
  }
};

/**
 * Extract Feature Vector from an Image / 从图像提取特征向量
 * Used during the registration phase.
 * 用于注册阶段。
 * 
 * @param imageElement HTML Video or Image element / 视频或图片DOM元素
 * @returns Float32Array (128 numbers) or null / 返回128个浮点数的数组或空
 */
export const extractFaceDescriptor = async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | null> => {
  if (!isModelLoaded) await loadModels();

  // Detect single face with highest confidence
  // 检测画面中置信度最高的一张人脸
  const detection = await faceapi.detectSingleFace(imageElement)
    .withFaceLandmarks()  // Align face / 对齐
    .withFaceDescriptor(); // Compute vector / 计算向量

  if (!detection) return null;
  
  // The 'descriptor' is the unique biometric signature of the face
  // 'descriptor' 是人脸的唯一生物特征签名
  return detection.descriptor;
};

/**
 * Build/Update the Face Matcher from Profiles / 构建或更新人脸匹配器
 * 
 * Performance Optimization:
 * This creates a reference set of known vectors. It checks if data changed before rebuilding.
 * 性能优化：创建已知向量的参考集。仅当数据发生变化时才重建，避免重复计算。
 */
const updateFaceMatcher = (profiles: PersonProfile[]) => {
  // Check if total number of vectors has changed (Simple dirty check)
  // 检查向量总数是否变化（简单的脏检查）
  const currentDescriptorCount = profiles.reduce((acc, p) => acc + p.descriptors.length, 0);
  
  // If count is same and matcher exists, skip rebuilding to save CPU
  // 如果数量一致且匹配器已存在，跳过重建以节省 CPU
  if (currentDescriptorCount === lastDescriptorCount && faceMatcher) {
    return;
  }

  console.log(`Updating AI Matcher with ${currentDescriptorCount} vectors... / 正在更新 AI 匹配器...`);

  const labeledDescriptors: any[] = [];

  profiles.forEach(p => {
    // Only add profiles that have feature vectors
    // 仅添加拥有特征向量的档案
    if (p.descriptors && p.descriptors.length > 0) {
        // Convert plain arrays back to Float32Arrays (Required by TensorFlow.js)
        // 将普通数组转回 Float32Array（TensorFlow.js 计算需要这种格式）
        const vectors = p.descriptors.map(d => new Float32Array(d));
        
        // Associate the name with the vectors
        // 将姓名与向量组关联
        labeledDescriptors.push(
            new faceapi.LabeledFaceDescriptors(p.name, vectors)
        );
    }
  });

  if (labeledDescriptors.length > 0) {
    // Create the matcher with the defined threshold
    // 创建匹配器
    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, CONFIG.DISTANCE_THRESHOLD);
  } else {
    faceMatcher = null;
  }
  
  lastDescriptorCount = currentDescriptorCount;
};

/**
 * Real-time Face Detection & Recognition / 实时人脸检测与识别
 * 
 * This function runs every frame in the video loop.
 * 此函数在视频循环的每一帧中运行。
 */
export const detectFacesReal = async (
  video: HTMLVideoElement,
  profiles: PersonProfile[]
): Promise<FaceDetection[]> => {
  
  if (!isModelLoaded || !video || video.paused || video.ended) return [];

  // 1. Detect All Faces in the frame
  // 1. 检测画面中的所有是一张或多张人脸
  // Using SSD MobileNet for speed / 使用 SSD MobileNet 保证速度
  const detections = await faceapi.detectAllFaces(video)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!detections.length) return [];

  // 2. Update Matcher (Only if needed)
  // 2. 更新匹配器 (仅当数据变动时)
  updateFaceMatcher(profiles);

  // 3. Match each detected face against the database
  // 3. 将检测到的每一张脸与数据库进行比对
  const results: FaceDetection[] = detections.map((d: any) => {
    let name = "Unknown";
    let confidence = 0; // Display confidence (0-100) / 展示用的置信度
    let identified = false;

    if (faceMatcher) {
      // Find the best match in the database
      // 在数据库中寻找最佳匹配
      const bestMatch = faceMatcher.findBestMatch(d.descriptor);
      
      if (bestMatch.label !== 'unknown') {
        name = bestMatch.label;
        identified = true;
        
        // Calculate Confidence based on Euclidean Distance
        // 基于欧氏距离计算置信度
        // Distance 0.0 = Identical (100% match) / 距离 0.0 = 完全一致
        // Distance 0.55 = Threshold / 距离 0.55 = 阈值
        const score = Math.max(0, 1 - (bestMatch.distance / CONFIG.DISTANCE_THRESHOLD));
        confidence = Math.floor(score * 100); 
      } else {
         // Even if unknown, show how close it was relative to 1.0 distance
         // 即使是陌生人，也显示一下接近程度
         confidence = Math.floor((1 - Math.min(1, bestMatch.distance)) * 100); 
      }
    }

    // 4. Normalize Coordinates to 0-1000 scale (Responsive UI)
    // 4. 将坐标归一化到 0-1000 的尺度（为了适应响应式 UI）
    const box = d.detection.box; // { x, y, width, height }
    
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const scaleX = 1000 / vW;
    const scaleY = 1000 / vH;

    return {
      identified,
      name,
      confidence,
      box_2d: [
        box.y * scaleY,             // ymin
        box.x * scaleX,             // xmin
        (box.y + box.height) * scaleY, // ymax
        (box.x + box.width) * scaleX   // xmax
      ]
    };
  });

  return results;
};
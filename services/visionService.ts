import { PersonProfile, FaceDetection } from "../types";

/**
 * REAL AI VISION ENGINE (Powered by face-api.js)
 * 真实 AI 视觉引擎 (基于 face-api.js / TensorFlow.js)
 */

declare const faceapi: any; // Global from CDN (in index.html)

// SINGLETON STATE
let isCriticalModelsLoaded = false;
let isDemographicsLoaded = false; 
let faceMatcher: any = null;
let lastDescriptorCount = -1;

// PROMISE CACHE (Prevents double-loading race conditions)
let loadingPromise: Promise<boolean> | null = null;

// Configuration
const CONFIG = {
  // Switch to GitHub Pages hosting which is often more stable for these static assets than jsDelivr GH proxy
  // 切换到更稳定的模型源
  MODEL_URL: 'https://justadudewhohacks.github.io/face-api.js/models',
  // Fallback URL in case the above fails (optional logic can be added later)
  // MODEL_URL_BACKUP: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights',
  TIMEOUT_MS: 15000 // 15 seconds timeout
};

// Helper: Timeout Wrapper for Promises
const withTimeout = (ms: number, promise: Promise<any>) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((reason) => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};

/**
 * Load AI Models (Singleton Pattern with Timeout)
 * 加载 AI 模型（带超时的单例模式）
 */
export const loadModels = (): Promise<boolean> => {
  // 0. Safety Check for Global
  if (typeof faceapi === 'undefined') {
    console.error("Face-api.js not loaded. Check index.html or network connection.");
    return Promise.resolve(false);
  }

  // 1. If already loaded, return immediately
  if (isCriticalModelsLoaded) return Promise.resolve(true);

  // 2. If currently loading, return the existing promise
  if (loadingPromise) return loadingPromise;

  // 3. Start loading
  loadingPromise = (async () => {
    try {
      console.log(`Loading Critical Face Models from ${CONFIG.MODEL_URL}...`);
      
      // Load models with strict timeout to prevent hanging
      await withTimeout(CONFIG.TIMEOUT_MS, Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(CONFIG.MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(CONFIG.MODEL_URL)
      ]));
      
      isCriticalModelsLoaded = true;
      console.log("Critical Models Loaded Successfully.");

      // Load Demographics (Non-blocking / Optional)
      // We don't await this strictly for the main promise to resolve true, 
      // but we start it here.
      withTimeout(CONFIG.TIMEOUT_MS, Promise.all([
          faceapi.nets.faceExpressionNet.loadFromUri(CONFIG.MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(CONFIG.MODEL_URL)
      ]))
      .then(() => {
          isDemographicsLoaded = true;
          console.log("Demographics Loaded.");
      })
      .catch(e => console.warn("Demographics skipped:", e));

      return true;
    } catch (error) {
      console.error("CRITICAL: Failed to load core models:", error);
      // IMPORTANT: Reset promise so UI can try again manually if needed
      loadingPromise = null; 
      isCriticalModelsLoaded = false;
      return false;
    }
  })();

  return loadingPromise;
};

/**
 * Extract Feature Vector from an Image
 */
export const extractFaceDescriptor = async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | null> => {
  if (!isCriticalModelsLoaded) {
      // Try loading one last time
      const success = await loadModels();
      if (!success) return null;
  }

  try {
      // Ensure element is valid and ready
      if (imageElement instanceof HTMLVideoElement && (imageElement.paused || imageElement.ended || !imageElement.videoWidth)) {
        return null;
      }

      const detection = await faceapi.detectSingleFace(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;
      return detection.descriptor;
  } catch (e) {
      console.error("Extraction error:", e);
      return null;
  }
};

/**
 * Build/Update the Face Matcher
 */
const updateFaceMatcher = (profiles: PersonProfile[], threshold: number) => {
  if (!faceapi) return;

  const currentDescriptorCount = profiles.reduce((acc, p) => acc + p.descriptors.length, 0);
  
  if (currentDescriptorCount === lastDescriptorCount && faceMatcher) {
    return;
  }

  const labeledDescriptors: any[] = [];
  profiles.forEach(p => {
    if (p.descriptors && p.descriptors.length > 0) {
        // Convert plain arrays back to Float32Array for face-api
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
 */
export const detectFacesReal = async (
  video: HTMLVideoElement,
  profiles: PersonProfile[],
  threshold: number = 0.55
): Promise<FaceDetection[]> => {
  
  if (!isCriticalModelsLoaded || !video || video.paused || video.ended || !faceapi) return [];

  try {
    // 1. Detection
    // Use lightweight detection options if possible for speed, but SSD is standard in this app
    let task = faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
    
    if (isDemographicsLoaded) {
        task = task.withFaceExpressions().withAgeAndGender();
    }

    const detections = await task;
    if (!detections.length) return [];

    // 2. Update Matcher (Sync)
    updateFaceMatcher(profiles, threshold);

    // 3. Match
    const results: FaceDetection[] = detections.map((d: any) => {
      let name = "Unknown";
      let confidence = 0;
      let identified = false;

      if (faceMatcher) {
        const bestMatch = faceMatcher.findBestMatch(d.descriptor);
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
      const box = d.detection.box; 
      const vW = video.videoWidth || 640;
      const vH = video.videoHeight || 480;
      // Safety div by zero check
      const scaleX = vW > 0 ? 1000 / vW : 1;
      const scaleY = vH > 0 ? 1000 / vH : 1;

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
  } catch (err) {
    console.warn("Face detection pipeline skipped frame:", err);
    return [];
  }
};

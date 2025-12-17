import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PersonProfile, RecognitionLog } from '../types';

/**
 * Custom Hook for Managing Face System State
 * 管理人脸系统状态的自定义 Hook
 * 
 * Responsibilities / 职责:
 * 1. Manage User Profiles (CRUD) / 管理用户档案（增删改查）
 * 2. Handle Data Persistence (LocalStorage) / 处理数据持久化
 * 3. Manage Recognition Logs / 管理识别日志
 */
export const useFaceSystem = () => {
  // ----------------------------------------------------------------
  // STATE INITIALIZATION / 状态初始化
  // ----------------------------------------------------------------

  // Load Profiles from LocalStorage / 从本地存储加载档案
  // This ensures data survives page reloads. / 这确保了数据在页面刷新后依然存在。
  const [profiles, setProfiles] = useState<PersonProfile[]>(() => {
    try {
        const saved = localStorage.getItem('face-guard-profiles');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("LocalStorage error", e);
        return [];
    }
  });

  // Load Threshold / 加载识别阈值
  const [threshold, setThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('face-guard-threshold');
    return saved ? parseFloat(saved) : 0.55;
  });

  const [logs, setLogs] = useState<RecognitionLog[]>([]);

  // ----------------------------------------------------------------
  // PERSISTENCE EFFECTS / 持久化副作用
  // ----------------------------------------------------------------

  // Auto-save Profiles whenever they change / 当档案发生变化时自动保存
  useEffect(() => {
    try {
      localStorage.setItem('face-guard-profiles', JSON.stringify(profiles));
    } catch (e) {
      console.error("LocalStorage Save Failed", e);
      // Safe guard: Notify user if storage is full (usually ~5MB limit)
      // 安全保护：如果存储空间已满（通常约 5MB），通知用户
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        alert("⚠️ Storage Full! Some data may not be saved. Please delete old profiles.\n⚠️ 存储空间已满！部分数据可能未保存，请删除旧档案。");
      }
    }
  }, [profiles]);

  // Auto-save Threshold / 自动保存阈值
  useEffect(() => {
    localStorage.setItem('face-guard-threshold', threshold.toString());
  }, [threshold]);

  // ----------------------------------------------------------------
  // MANAGEMENT ACTIONS / 管理操作
  // ----------------------------------------------------------------

  /**
   * Register New Person / 注册新用户
   * Creates a new profile with a unique ID, name, and initial face descriptor.
   * 创建一个包含唯一ID、姓名和初始人脸特征向量的新档案。
   */
  const addProfile = useCallback((name: string, image: string, descriptor?: number[]) => {
    const newProfile: PersonProfile = {
      id: uuidv4(),
      name,
      images: [image],
      createdAt: Date.now(),
      descriptors: descriptor ? [descriptor] : [] 
    };
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, []);

  /**
   * Delete Profile / 删除档案
   * Removes a person entirely from the database.
   * 从数据库中完全移除某个人。
   */
  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  /**
   * Active Learning: Add Sample / 主动学习：添加训练样本
   * Adds a new angle/expression to an EXISTING person to improve accuracy.
   * 为现有用户添加新的角度/表情，以提高识别准确率。
   */
  const addSampleToProfile = useCallback((id: string, image: string, descriptor: number[]) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          // Append new image and vector / 追加新图片和向量
          images: [...p.images, image], 
          descriptors: [...p.descriptors, descriptor] 
        };
      }
      return p;
    }));
  }, []);

  /**
   * Remove specific sample / 移除特定样本
   * Deletes a single bad photo/vector without deleting the whole user.
   * 删除单个质量不佳的照片/向量，而不删除整个用户。
   */
  const removeSampleFromProfile = useCallback((profileId: string, index: number) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === profileId) {
        const newImages = [...p.images];
        const newDescriptors = [...p.descriptors];
        // Remove item at specific index / 移除指定索引的项
        newImages.splice(index, 1);
        newDescriptors.splice(index, 1);
        return {
          ...p,
          images: newImages,
          descriptors: newDescriptors
        };
      }
      return p;
    }));
  }, []);

  /**
   * Log Recognition Event / 记录识别事件
   * Adds a record to the live log stream.
   * 向实时日志流添加一条记录。
   */
  const addLog = useCallback((log: RecognitionLog) => {
    setLogs(prev => {
      // Debounce: Don't log same person within 1.5 seconds to prevent spam
      // 防抖：1.5秒内不重复记录同一人，防止日志刷屏
      if (prev.length > 0) {
        const last = prev[0];
        if (last.personName === log.personName && (log.timestamp - last.timestamp) < 1500) {
           return prev;
        }
      }
      const newLogs = [log, ...prev];
      // Keep only last 200 logs for performance / 仅保留最近200条日志以保证性能
      return newLogs.slice(0, 200); 
    });
  }, []);

  return {
    profiles,
    logs,
    threshold,
    setThreshold,
    addProfile,
    deleteProfile,
    addSampleToProfile,
    removeSampleFromProfile,
    addLog
  };
};
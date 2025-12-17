import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PersonProfile, RecognitionLog } from '../types';

/**
 * Custom Hook for Managing Face System State
 * 管理人脸系统状态的自定义 Hook
 */
export const useFaceSystem = () => {
  // Load Profiles from LocalStorage / 从本地存储加载档案
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

  // Persist Profiles / 持久化档案
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

  // Persist Threshold / 持久化阈值
  useEffect(() => {
    localStorage.setItem('face-guard-threshold', threshold.toString());
  }, [threshold]);

  /**
   * Register New Person / 注册新用户
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
   */
  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  /**
   * Active Learning: Add Sample / 主动学习：添加训练样本
   */
  const addSampleToProfile = useCallback((id: string, image: string, descriptor: number[]) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          images: [...p.images, image], 
          descriptors: [...p.descriptors, descriptor] 
        };
      }
      return p;
    }));
  }, []);

  /**
   * Remove specific sample / 移除特定样本
   */
  const removeSampleFromProfile = useCallback((profileId: string, index: number) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === profileId) {
        const newImages = [...p.images];
        const newDescriptors = [...p.descriptors];
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
   */
  const addLog = useCallback((log: RecognitionLog) => {
    setLogs(prev => {
      // Debounce: Don't log same person within 1.5 seconds
      // 防抖：1.5秒内不重复记录同一人
      if (prev.length > 0) {
        const last = prev[0];
        if (last.personName === log.personName && (log.timestamp - last.timestamp) < 1500) {
           return prev;
        }
      }
      const newLogs = [log, ...prev];
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
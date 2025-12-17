# 68344042-4 Face Guard System Documentation / 人脸防护系统文档

## 1. Project Overview / 项目概述

**Face Guard** is a professional, browser-based real-time face recognition system. Unlike traditional solutions that rely on heavy Python backends, this project runs entirely on the client side using **TensorFlow.js**.

**Face Guard** 是一个专业的、基于浏览器的实时人脸识别系统。与依赖繁重 Python 后端的传统方案不同，本项目使用 **TensorFlow.js** 完全在客户端运行。

### Key Features / 核心特性

*   **🛡️ Privacy First / 隐私优先**
    *   All biometric data (images and feature vectors) is processed and stored locally in the browser's memory. No data is sent to any server.
    *   所有生物特征数据（图像和特征向量）均在浏览器内存中本地处理和存储。没有任何数据会被发送到服务器。

*   **🧠 Active Learning / 主动学习**
    *   Supports dynamic registration of multiple face angles for a single identity. The system learns and improves accuracy over time as you add more samples.
    *   支持为同一身份动态注册多个角度的人脸。随着样本的增加，系统会不断学习并提高识别准确率。

*   **👤 Enhanced Analytics / 增强分析**
    *   **New**: Real-time Age, Gender, and Expression detection.
    *   **新增**: 实时年龄、性别和表情检测。

*   **📊 Real-time Visualization / 实时可视化**
    *   Features a responsive dashboard with live confidence streams, detection frequency charts, and recognition confidence trends.
    *   具备响应式仪表盘，提供实时置信度数据流、识别频率图表以及识别置信度趋势图。

---

## 2. Technical Principles / 技术原理

The system operates on a pipeline of neural networks powered by `face-api.js`:
本系统基于 `face-api.js` 运行由多个神经网络组成的流水线：

### 2.1 The AI Pipeline / AI 流水线

1.  **Face Detection (SSD MobileNet V1)**
    *   **Function**: Locates the bounding box of faces in the video frame.
    *   **功能**: 定位视频帧中人脸的边界框。

2.  **Face Landmark 68 Net**
    *   **Function**: Aligns the face geometrically (eyes, nose, mouth).
    *   **功能**: 对人脸进行几何对齐（眼睛、鼻子、嘴巴）。

3.  **Face Recognition (ResNet-34)**
    *   **Function**: Extracts the unique "Fingerprint" (128-d vector) for matching.
    *   **功能**: 提取人脸的唯一“指纹”（128维向量）用于匹配。

4.  **Demographics (Age & Gender Net / Face Expression Net)**
    *   **Function**: Estimates age, gender, and current emotional state.
    *   **Limitation**: **Does NOT support Race or Skin Tone classification**. This is a limitation of the underlying model architecture and training data.
    *   **功能**: 估算年龄、性别和当前情绪状态。
    *   **限制**: **不支持人种或肤色分类**。这是底层模型架构和训练数据的限制。

### 2.2 Matching Logic / 匹配逻辑

The system identifies users by calculating the **Euclidean Distance** between the real-time vector and stored vectors.
系统通过计算实时向量与存储向量之间的 **欧氏距离** 来识别用户。

*   **Distance < 0.55**: ✅ **Match Confirmed** (System considers them the same person).
*   **Distance > 0.55**: ❌ **Unknown** (System considers them different people).

---

## 3. Deployment Guide (Cloudflare via GitHub) / 部署指南 (通过 GitHub)

**IMPORTANT: Please read carefully to avoid the "Hello World" error.**
**重要：请仔细阅读以避免出现 "Hello World" 错误。**

You encountered an issue where there was no "Build output directory" option. This means you accidentally created a **Worker** instead of a **Page**.
您之前遇到的“没有构建输出目录选项”的问题，是因为您误创建了 **Worker** 而不是 **Page**。

### Correct Steps to Deploy / 正确部署步骤

1.  **Commit & Push Code**:
    *   Ensure the changes to `index.html` (removing importmap) are pushed to your GitHub repository.
    *   确保已将 `index.html` 的修改（移除 importmap）推送到 GitHub。

2.  **Go to Cloudflare Dashboard**:
    *   Navigate to **Workers & Pages** -> **Overview**.
    *   进入 Cloudflare 控制台 -> **Workers & Pages** -> **概览**。

3.  **Delete the Wrong Project (Optional but Recommended)**:
    *   If you have a project showing "Hello World", delete it to avoid confusion.
    *   如果有一个显示 "Hello World" 的项目，建议先删除它。

4.  **Create Application (The Critical Step)**:
    *   Click **Create application** (创建应用).
    *   **LOOK AT THE TABS**: You will see two tabs: "Workers" and "Pages".
    *   **CLICK "PAGES"**. (一定要点击 **Pages** 标签页)。
    *   Click **Connect to Git** (连接到 Git)。

5.  **Configure Build**:
    *   Select your repository.
    *   **Project Name**: Enter `face-guard` (or any name).
    *   **Framework Preset**: Select `Vite` or `React`.
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
        *   *(If you are in the right place, you WILL see this option / 如果操作正确，您一定会看到这个选项)*.

6.  **Save and Deploy**:
    *   Click **Save and Deploy**. Cloudflare will pull your code, run `npm install`, `npm run build`, and host the `dist` folder.

---

## 4. Usage Guide / 使用指南

### Step 1: Initialization / 初始化
1.  Open the application URL.
2.  **Wait**: The screen will show "Initializing Neural Networks". It downloads ~12MB of model weights.
3.  **Permission**: Click "Allow" when the browser asks for camera access.

### Step 2: Registration / 注册身份
1.  Switch to the **CONFIG** tab.
2.  Enter a name and click **Register ID**.

### Step 3: Optimization / 优化
*To ensure robust recognition:*
1.  Find your card in the list.
2.  Click **+ Add Training Sample**.
3.  Turn your head (Left/Right/Up/Down) and add samples.

### Step 4: Monitoring / 监控
1.  Switch back to the **MONITOR** tab.
2.  Walk around. The system should track your face.

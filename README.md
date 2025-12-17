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

## 3. Function Manual / 功能说明

### 3.1 Monitor Tab (Live Recognition) / 实时监控

*   **Main Viewport**: Displays the camera feed with Augmented Reality (AR) overlays.
    *   **Green Box**: Known person.
    *   **Red Box**: Unknown person.
    *   **Info Tag**: Shows Name, Confidence, **Gender**, **Age**, and **Expression**.
*   **Right Sidebar**: A scrolling log of recent recognitions.

### 3.2 Config Tab (Management & Analytics) / 配置管理

This tab is divided into two sub-sections:
此标签页分为两个子部分：

#### A. Face Database / 人脸库管理
*   **Register Identity**: Input a name and capture a photo to create a new ID.
*   **Training & Optimization**: Select an existing user to add more angles (Active Learning).
*   **Manage Samples**: Click on a user's card image to view all stored vectors.

#### B. Analytics / 数据分析
*   **Dataset Distribution**: Shows how many training samples each user has.
*   **Recognition Frequency**: Shows who appears most often.
*   **Confidence Trend**: Tracks the AI's confidence score.

---

## 4. Usage Guide / 使用指南

### Step 1: Initialization / 初始化
1.  Open the application.
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
2.  Walk around. The system should track your face, age, gender, and expression.

---

## 5. Deployment / 部署指南

### Deploy to Cloudflare Pages (部署到 Cloudflare Pages)

This project is configured to use **Vite** for building static assets.
本项目配置了 **Vite** 用于构建静态资源。

**Prerequisites / 前置条件**:
1.  A GitHub Account / GitHub 账号.
2.  A Cloudflare Account / Cloudflare 账号.

**Steps / 步骤**:

1.  **Push to GitHub / 推送到 GitHub**:
    *   Commit all files to a GitHub repository.
    *   将所有文件提交到 GitHub 仓库。

2.  **Cloudflare Pages Dashboard / Cloudflare 控制台**:
    *   Log in to Cloudflare Dashboard -> **Workers & Pages**.
    *   Click **Create application** -> **Pages** -> **Connect to Git**.
    *   Select your repository.
    *   登录 Cloudflare -> **Workers & Pages**。
    *   点击 **Create application** -> **Pages** -> **Connect to Git**。
    *   选择你的仓库。

3.  **Build Configuration / 构建配置**:
    *   **Framework preset (框架预设)**: Select `Vite` or `React`.
    *   **Build command (构建命令)**: `npm run build`
    *   **Build output directory (构建输出目录)**: `dist`
    *   Click **Save and Deploy**.

4.  **Finish / 完成**:
    *   Wait for the build to complete. Cloudflare will provide a URL (e.g., `https://your-project.pages.dev`).
    *   等待构建完成。Cloudflare 会提供一个访问链接。

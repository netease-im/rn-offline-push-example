# RN Offline Push Playground

一个基于 React Native 0.74.3 的 NIM 离线推送演示项目.

## 1. 环境要求

- Node.js 18 或更高版本
- JDK 17
- Android Studio、Android SDK 和一台 Android 真机
- Xcode、CocoaPods 和一台 iOS 真机
- 已在网易云信控制台创建应用，并准备好账号、appkey、登录 token 和推送证书

以及 [RN 推送插件下载地址](https://yx-web-nosdn.netease.im/sdk-release/nim/plugin/rn/android/nimpush.zip), 本工程已经集成了, 做个演示.

模拟器可以用于验证 RN 页面和基础编译，但厂商推送、Android 设备 token 和 APNs token 建议使用真实设备验证。

## 2. 配置项目

客户需要先复制 [config.example.ts](./config.example.ts) 为根目录 `config.ts`，再填写配置。页面、NIM 登录和推送初始化都会从这里读取配置。`config.ts` 是本地私密配置，不应提交。

```ts
// config.ts
export const DEFAULT_ACCOUNT = ''; // 登录账号
export const DEFAULT_CONVERSATION_TARGET_ACCOUNT = ''; // 要聊天的对方账号
export const DEFAULT_APPKEY = ''; // appkey
export const STATIC_TOKEN = '*********'; // 静态登录 token
export const RN_PACKAGE_NAME = 'com.example.rnofflinepush'; // Android 包名

// 在 IM 后台配置好的推送 appid, 推送证书名等推送信息. 将在初始化时注入 sdk.
export const offlinePushConfig = {
  miPush: {
    appId: 'YOUR_MI_PUSH_APP_ID',
    appKey: 'YOUR_MI_PUSH_APP_KEY',
    certificateName: 'YOUR_MI_PUSH_CERTIFICATE_NAME',
  },
  vivoPush: {
    certificateName: 'YOUR_VIVO_PUSH_CERTIFICATE_NAME',
  },
  oppoPush: {
    appId: 'YOUR_OPPO_PUSH_APP_ID',
    appKey: 'YOUR_OPPO_PUSH_APP_KEY',
    secret: 'YOUR_OPPO_PUSH_SECRET',
    certificateName: 'YOUR_OPPO_PUSH_CERTIFICATE_NAME',
  },
  hwPush: {
    appId: 'YOUR_HUAWEI_PUSH_APP_ID',
    certificateName: 'YOUR_HUAWEI_PUSH_CERTIFICATE_NAME',
  },
  fcmPush: {
    certificateName: 'YOUR_FCM_CERTIFICATE_NAME',
  },
  mzPush: {
    appId: 'YOUR_MEIZU_PUSH_APP_ID',
    appKey: 'YOUR_MEIZU_PUSH_APP_KEY',
    certificateName: 'YOUR_MEIZU_PUSH_CERTIFICATE_NAME',
  },
  honorPush: {
    certificateName: 'YOUR_HONOR_PUSH_CERTIFICATE_NAME',
  },
  apns: {
    certificateName: 'YOUR_APNS_CERTIFICATE_NAME',
  },
};

```

```bash
cp config.example.ts config.ts
```

配置项说明：

- `DEFAULT_ACCOUNT`：默认登录账号。
- `DEFAULT_CONVERSATION_TARGET_ACCOUNT`：默认聊天对方账号。
- `DEFAULT_APPKEY`：默认填入表单的 appkey。
- 会话 ID：页面根据本账号和聊天对方账号自动生成单聊会话 ID：`account|1|targetAccount`。页面中可以直接修改聊天对方账号，不需要手动填写会话 ID。
- `STATIC_TOKEN`：登录使用的 token。当前页面沿用了 uni-app 示例的固定 token 方式，没有单独显示 token 输入框。
- `RN_PACKAGE_NAME`：Android 包名模板为 `com.example.rnofflinepush`，必须和 `android/app/build.gradle` 中的 `applicationId`、`namespace`、Kotlin 源码 package 路径以及厂商 JSON 中的 `package_name` 保持一致；开发者需要替换为自己的包名。

`config.ts` 中的 `offlinePushConfig` 是推送配置。需要把其中的厂商 AppId、AppKey、Secret 和 `certificateName` 替换成自己的值。`certificateName` 必须与网易云信控制台上传的证书名称完全一致。

不要把正式 token、厂商 Secret 或证书私钥提交到公共代码仓库。这个文件用于演示项目配置，正式项目建议通过安全的构建参数或私有配置注入。

## 3. Android 推送配置

当前项目已经放置好 `android/nimpush`，并完成了基础接入：

- `android/settings.gradle` 已包含 `include ':nimpush'`。
- `android/app/build.gradle` 已依赖 `project(':nimpush')` 和 `app/libs` 下的厂商 SDK。
- `MainApplication.kt` 已手动注册 `NIMPushPackage`。
- `AndroidManifest.xml` 已包含小米、魅族、vivo、OPPO、FCM、华为和荣耀的 receiver/service 配置。
- `android/app/google-services.json`、`agconnect-services.json` 和 `mcs-services.json` 是已经脱敏的模板文件。开发者必须从对应厂商控制台下载自己的文件替换它们，并在提交前确认没有把真实文件提交到仓库。

接入或替换为客户配置时按下面步骤操作：

1. 保持 `android/nimpush` 位于 React Native 工程的 `android/` 目录下，不要移动到项目根目录之外。

2. 将 `android/nimpush/libs` 中需要的 SDK 文件同步到 `android/app/libs`。当前包括：

   - `rnpush.jar`
   - `MiPush_SDK_Client_6_0_1-C_3rd.aar`
   - `vivo_pushSDK_v4.0.4.0_504.aar`
   - `com.heytap.msp_3.5.1.aar`

3. 替换厂商平台配置文件：

   - FCM：将 Firebase 控制台生成的 `google-services.json` 放到 `android/app/`。
   - 华为：将 AppGallery Connect 生成的 `agconnect-services.json` 放到 `android/app/`，并确认签名证书指纹匹配。
   - 荣耀：将荣耀平台生成的 `mcs-services.json` 放到 `android/app/`。

4. 检查三个 JSON 文件中的包名必须是当前 `applicationId`，即模板中的 `com.example.rnofflinepush`，或者与你修改后的包名完全一致。

5. 如果修改了包名，还需要同步修改：

   - `config.ts` 的 `RN_PACKAGE_NAME`。
   - `android/app/build.gradle` 的 `namespace` 和 `applicationId`。
   - `android/app/src/main/java/...` 下 `MainActivity.kt`、`MainApplication.kt` 的 package 声明和目录。
   - `google-services.json`、`agconnect-services.json`、`mcs-services.json` 中的 package name。

本发布版本使用脱敏后的原生标识：Android `applicationId`/`namespace` 和 iOS Bundle ID 均为 `com.example.rnofflinepush`。开发者必须替换为自己的应用标识，并重新在各厂商推送平台及 Apple Developer 中创建或配置对应应用。

- `AndroidManifest.xml` 中手写的厂商 AppId、AppKey 和服务配置。

6. 根据实际厂商账号修改 `android/app/src/main/AndroidManifest.xml`：

   - vivo 的 `com.vivo.push.api_key` 和 `com.vivo.push.app_id`。
   - 荣耀的 `com.hihonor.push.app_id`。
   - 小米、魅族、OPPO、FCM、华为、荣耀的 receiver/service 必须保留并与 SDK 版本匹配。

7. Android 13 及以上版本需要用户授予通知权限。项目的 Manifest 和厂商 SDK 接入不等于已经获得运行时通知权限；如果设备没有通知权限，token 可能正常但通知不会展示。正式项目应在合适的时机申请 `POST_NOTIFICATIONS`。

8. Android 厂商推送通常要求真实设备、对应厂商系统和正确签名。普通 Android 模拟器不能代表小米、vivo、OPPO、华为或荣耀的真实推送结果。

### Android SDK 与签名

命令行构建需要 Android SDK。可以在 Android Studio 中安装 SDK；如果 Gradle 找不到 SDK，在被忽略的 `android/local.properties` 中填写本机路径：

```properties
sdk.dir=/absolute/path/to/Android/sdk
```

调试包使用 Android Gradle Plugin 的默认 debug 签名，不需要把 `debug.keystore` 提交到仓库。发布包必须使用自己的正式 keystore，不要使用 debug 签名：

1. 生成或准备正式 keystore，并妥善保存 keystore 文件和密码。

   ```bash
   keytool -genkeypair -v \
     -keystore /absolute/path/to/release.keystore \
     -alias release \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

2. 在用户级 Gradle 配置 `~/.gradle/gradle.properties` 中填写以下属性。该文件不在项目仓库内：

   ```properties
   MYAPP_UPLOAD_STORE_FILE=/absolute/path/to/release.keystore
   MYAPP_UPLOAD_STORE_PASSWORD=your_store_password
   MYAPP_UPLOAD_KEY_ALIAS=release
   MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
   ```

3. 执行 `cd android && ./gradlew assembleRelease`。项目只会在 `MYAPP_UPLOAD_STORE_FILE` 存在时启用正式签名配置。

4. 将正式 keystore 的 SHA-256 指纹配置到对应厂商平台。华为还需要把该指纹配置到 AppGallery Connect，确保发布包能获取华为推送 Token。

### 其他厂商依赖

小米、vivo、OPPO、魅族、FCM 和荣耀的厂商依赖、控制台创建及参数配置请参考网易云信官方文档：[添加厂商依赖](https://doc.yunxin.163.com/messaging2/guide/zI2NTgxMTU?platform=client#%E6%B7%BB%E5%8A%A0%E5%8E%82%E5%95%86%E4%BE%9D%E8%B5%84)。本工程已完成 `nimpush` 基础接入，开发者仍需按文档创建自己的厂商应用、替换厂商 SDK 配置和填写 `config.ts`。

### 华为推送配置

华为推送同时依赖 AppGallery Connect 文件、应用签名和 NIM 推送配置，三者必须属于同一个华为应用：

1. 在华为 AppGallery Connect 创建项目和 Android 应用，包名填写 `android/app/build.gradle` 中的 `applicationId`。模板默认是 `com.example.rnofflinepush`，实际接入时请替换为自己的包名。

2. 在该应用中开通 Push Kit，按华为控制台要求完善应用信息。

3. 在 AppGallery Connect 的应用信息中配置签名证书指纹。调试包和发布包使用的签名不同，必须分别配置对应的 SHA-256 指纹。发布包使用本节“Android SDK 与签名”中的正式 keystore。

4. 从 AppGallery Connect 下载与该应用匹配的 `agconnect-services.json`，替换项目中的 `android/app/agconnect-services.json`。不要只修改包名来伪造该文件，必须使用华为控制台生成的文件。

5. 在 `config.ts` 中配置：

   ```ts
   hwPush: {
     appId: '华为 AppGallery Connect 中的 App ID',
     certificateName: '网易云信控制台中的华为证书名称',
   },
   ```

   `hwPush.appId` 必须与 `agconnect-services.json` 中的 `client.app_id`、`app_info.app_id` 和 `appInfos[].app_info.app_id` 一致；`certificateName` 必须与网易云信控制台上传的华为推送证书名称完全一致。

6. 确认 `agconnect-services.json` 中所有 `package_name` 与 `applicationId` 一致。该文件中的 `client_secret`、`api_key` 等字段属于私密配置，不能提交到公共仓库。

7. 使用支持 HMS Core 的华为真机测试。华为推送 Token 获取成功不代表通知一定展示，还需要检查系统通知权限、电池策略和应用签名是否匹配。

荣耀推送使用单独的 `mcs-services.json`，不要将荣耀配置文件当作华为配置文件使用。荣耀的 App ID 还需要同步填写 `config.ts` 和 `AndroidManifest.xml` 中的对应位置。

NIM 登录时，RN 代码会先执行：

```ts
configureOfflinePush(nim);
await nim.V2NIMLoginService.login(account, STATIC_TOKEN, loginOptions);
```

推送配置必须在登录前设置，否则当前登录不会带上正确的设备推送信息。

## 4. iOS 推送配置

当前项目使用 `@react-native-community/push-notification-ios`，Pod 依赖和 AppDelegate 回调已经接入。

本项目的 iOS Bundle ID 模板为 `com.example.rnofflinepush`。修改 Bundle ID 后，必须在 Apple Developer 中注册相同的 App ID，并重新配置签名和 APNs 能力。

接入时按下面步骤操作：

1. 确认 `package.json` 中存在 `@react-native-community/push-notification-ios`。

2. 在项目根目录安装 JS 依赖，然后安装 CocoaPods：

   ```bash
   yarn install
   cd ios
   pod install
   cd ..
   ```

3. 使用 `ios/RNOfflinePushPlayground.xcworkspace` 打开 Xcode，不要直接打开 `.xcodeproj`。

4. 在 Xcode 的 target 中打开 `Signing & Capabilities`，选择自己的 Apple Developer Team，添加 `Push Notifications` capability，并确认生成的 provisioning profile 支持 APNs。项目模板中的 Team ID 已清空，Bundle ID 为 `com.example.rnofflinepush`。

5. 发布包使用生产 APNs 时，确认签名环境、entitlements 和 provisioning profile 都是生产配置，不要直接沿用 development 配置。

6. `ios/RNOfflinePushPlayground/Info.plist` 已包含 `UIBackgroundModes` 的 `remote-notification`。如果修改了 target 或工程目录，确认这个配置仍然属于实际 App target。

7. 在 Apple Developer 中创建 APNs Auth Key，保存生成的 `.p8` 私钥，并记录 Key ID 和 Team ID。再将 P8、Bundle ID、Key ID、Team ID 和开发/生产环境配置到网易云信控制台。P8 私钥只在创建时提供下载，不要放入本项目。

8. 在 [config.ts](./config.ts) 中配置：

   ```ts
   apns: {
     certificateName: 'YOUR_APNS_CERTIFICATE_NAME',
   }
   ```

   这里的证书名称必须与网易云信控制台中的 APNs 证书名称一致。P8 证书对应的 Team ID、Key ID、Bundle ID 和环境也必须匹配。

9. 使用真实 iOS 设备测试 APNs。iOS Simulator 通常无法提供可用于真实 APNs 推送链路的 device token。

10. 首次测试时点击页面上的 `IOS申请通知权限`，或让 NIM 登录流程触发权限申请。用户拒绝权限后，需要到系统设置中重新打开通知权限。

当前接入的是普通 APNs 推送，不包含 PushKit/VoIP 推送。若业务需要 PushKit，需要额外配置 PushKit capability、证书、原生回调和对应的 NIM 配置。

## 5. 发送带推送参数的消息

点击 `发一条消息` 时，页面会：

1. 从 NIM 登录服务获取当前发送者账号。
2. 使用本账号和聊天对方账号生成单聊会话 ID：`account|1|targetAccount`。
3. 创建文本消息 `hello world`。
4. 使用 uni-app 示例中的复杂 `pushPayload`，并将其中的跳转目标适配为当前 RN 的 `MainActivity`。
5. 以如下配置发送消息：

   ```ts
   {
     pushConfig: {
       pushEnabled: true,
       pushPayload,
     },
   }
   ```

会话类型映射如下：

- RN/NIM `1`：单聊，对应旧版推送参数 `sessionType = '0'`。
- RN/NIM `2`：群聊，对应 `sessionType = '1'`。
- RN/NIM `3`：超大群，对应 `sessionType = '5'`。

本账号和聊天对方账号必须有效，并且当前登录账号必须有权发送给该账号。

### 推送点击参数

Android 推送点击后，`nimpush` 会读取 Intent 中的 `sessionType`、`sessionId` 以及其他 Extras，并通过 `NIMPushNotificationClick` 事件传给 RN。冷启动场景会暂存在原生模块中，RN 启动后通过 `getPendingPushClick` 读取。

iOS 推送点击后，`AppDelegate` 将通知响应转交给 `@react-native-community/push-notification-ios`。RN 页面监听 `localNotification` 事件处理 App 已在前台或后台的点击，并通过 `getInitialNotification()` 处理点击推送后冷启动 App 的场景。参数从通知对象的 `getData()` 中读取，同时输出到页面日志和 Metro。

点击参数会同时输出到页面日志、Metro 和 Android `logcat`。可以过滤：

```bash
adb logcat -v time | rg -i "NIMPushModule|NIMPushNotificationClick|push click intent"
```

参考 RN 工程没有对应的参数读取示例，原实现的 `handleIntent` 只负责清理通知；当前演示工程补充了参数读取和打印能力。

## 6. 启动验证

```bash
yarn install
yarn start
```

另开终端：

```bash
# Android
yarn android

# iOS
yarn ios
```

## 7. 配置与提交安全

`config.ts` 中的 `STATIC_TOKEN`、厂商 AppKey/Secret、证书名称，以及 Android 厂商 JSON 中的 App ID、API Key、Client Secret 等属于环境配置。项目只忽略本地 `config.ts`、`debug/`、`local.properties` 和 keystore 文件；仓库中的 Android JSON 是脱敏模板。开发者替换为真实文件后，提交前必须恢复模板或确认真实配置没有进入 Git。

APNs P8 私钥和 Android 正式 keystore 不应放进工程；Android 的 `google-services.json`、`agconnect-services.json` 和 `mcs-services.json` 应使用客户自己的控制台文件，并在提交前确认其中没有不应公开的凭据。后续提交时保留配置字段结构和包名说明，敏感值统一以占位符表示。

本地排查产生的详细日志统一放在 `debug/` 目录，该目录已被 `.gitignore` 忽略，仅供本机调试参照，不应提交或外传。

验证顺序建议为：

1. 配置 `config.ts`。
2. 确认 Android/iOS 原生包名、签名和厂商配置文件匹配。
3. 在真实设备上授予通知权限。
4. 填写或确认账号、appkey、会话 ID。
5. 点击 `连接`，确认日志出现登录成功和推送 token 相关信息。
6. 在另一端登录同一应用的目标账号。
7. 点击 `发一条消息`，检查目标设备的离线通知。
8. 点击通知，检查当前 RN Activity 是否被唤起，并检查日志中的推送点击参数。

常用检查：

```bash
yarn test
yarn lint
yarn tsc --noEmit
```

Android 原生构建：

```bash
cd android
./gradlew assembleDebug
```

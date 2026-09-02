# Android 推送配置

## 手动link

1. 首先，将推送插件 `nimpush` 放置在 `RN` 工程的 `android` 文件夹根目录下

2. 在 android/settings.gradle 中，添加如下配置:
``` gradle
include ':nimpush'
```

3. 在 android/app/build.gradle 的 dependencies 中，添加如下配置:
``` gradle
dependencies {
	implementation project(':nimpush')
}
```

4. 将 `nimpush/libs` 文件夹中的文件，拷贝到 `android/app/libs`中, 并在 android/app/build.gradle 的 dependencies 中，添加如下配置:
``` gradle
dependencies {
	implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])
}
```

5. 在 MainApplication 文件中，在 mReactNativeHost 的 getPackages 方法中，添加模块 NIMPushPackage
- java 配置
``` java
import com.netease.nim.rn.push.NIMPushPackage

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
       // ... 其它方法

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add push package
           packages.add(new NIMPushPackage());
          return packages;
        }
      };
}
```

``` kotlin
import com.netease.nim.rn.push.NIMPushPackage;

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
		// ... 其它方法

        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(NIMPushPackage())
            }
      }
}
```

## AndroidManifest.xml 配置
打开 android/app/src/main/AndroidManifest.xml，添加下面配置，使得安卓应用支持推送

### 小米

#### 推送服务和广播

```xml
<receiver
		android:exported="true"
		android:name="com.netease.nimlib.mixpush.mi.MiPushReceiver">
	<intent-filter android:priority="0x7fffffff">
		<action android:name="com.xiaomi.mipush.RECEIVE_MESSAGE"/>
		<action android:name="com.xiaomi.mipush.MESSAGE_ARRIVED"/>
		<action android:name="com.xiaomi.mipush.ERROR"/>
	</intent-filter>
</receiver>
```


### 魅族

#### 自定义权限

```xml
<!-- 兼容 Flyme5 的权限配置-->
<uses-permission android:name="com.meizu.flyme.push.permission.RECEIVE"/>
<permission
android:name="${applicationId}.push.permission.MESSAGE"
android:protectionLevel="signature"/>
<uses-permission android:name="{applicationId}.push.permission.MESSAGE"/>
		<!-- 兼容 Flyme3 的权限配置-->
<uses-permission android:name="com.meizu.c2dm.permission.RECEIVE"/>
<permission
android:name="${applicationId}.permission.C2D_MESSAGE"
android:protectionLevel="signature"/>
<uses-permission android:name="${applicationId}.permission.C2D_MESSAGE"/>
```

#### 推送服务和广播

```xml
<receiver
		android:exported="true"
		android:name="com.netease.nimlib.mixpush.mz.MZPushReceiver"
		android:permission="com.meizu.cloud.push.permission.MESSAGE">
	<intent-filter android:priority="0x7fffffff">
		<!-- 接收 push 消息 -->
		<action android:name="com.meizu.flyme.push.intent.MESSAGE"/>
		<!-- 接收 register 消息 -->
		<action android:name="com.meizu.flyme.push.intent.REGISTER.FEEDBACK"/>
		<!-- 接收 unregister 消息 -->
		<action android:name="com.meizu.flyme.push.intent.UNREGISTER.FEEDBACK"/>
		<!-- 兼容低版本 Flyme3 推送服务配置 -->
		<action android:name="com.meizu.c2dm.intent.REGISTRATION"/>
		<action android:name="com.meizu.c2dm.intent.RECEIVE"/>
		
		<category android:name="${applicationId}"/>
	</intent-filter>
</receiver>
```

### vivo

#### 应用信息配置
<meta-data
android:name="com.vivo.push.api_key"
android:value="vivo推送appkey"/>
<meta-data
android:name="com.vivo.push.app_id"
android:value="vivo推送appid"/>

#### 推送服务和广播

```xml
<receiver
		android:exported="true"
		android:name="com.netease.nimlib.mixpush.vivo.VivoPushReceiver">
	<intent-filter>
		
		<!-- 接收 push 消息 -->
		<action android:name="com.vivo.pushclient.action.RECEIVE"/>
	</intent-filter>
</receiver>
<service
android:exported="true"
android:name="com.vivo.push.sdk.service.CommandClientService"
android:permission="com.push.permission.UPSTAGESERVICE"/>
```

### OPPO

#### 依赖
在 `android/app/build.gradle` 中的 dependencies 中添加 gson 和 codec。此依赖在 oppo 推送时使用
```
dependencies {
    implementation 'com.google.code.gson:gson:2.8.1'
    implementation 'commons-codec:commons-codec:1.11'
}
```

#### 自定义权限

```xml
    <!--  oppo推送配置权限-->
<uses-permission android:name="com.coloros.mcs.permission.RECIEVE_MCS_MESSAGE"/>
<uses-permission android:name="com.heytap.mcs.permission.RECIEVE_MCS_MESSAGE"/>
```

#### 推送服务和广播

```xml
<!--Oppo推送配置项 需要配置以下两项-->
<!-- 兼容Q以下版本 继承CompatibleDataMessageCallbackService-->
<service
		android:exported="true"
		android:name="com.netease.nimlib.mixpush.oppo.OppoPushService"
		android:permission="com.coloros.mcs.permission.SEND_MCS_MESSAGE">
	<intent-filter>
		<action android:name="com.coloros.mcs.action.RECEIVE_MCS_MESSAGE"/>
	</intent-filter>
</service>
		<!-- 兼容Q版本 继承DataMessageCallbackService-->
<service
android:exported="true"
android:name="com.netease.nimlib.mixpush.oppo.OppoAppPushService"
android:permission="com.heytap.mcs.permission.SEND_PUSH_MESSAGE">
<intent-filter>
	<action android:name="com.heytap.mcs.action.RECEIVE_MCS_MESSAGE"/>
	<action android:name="com.heytap.msp.push.RECEIVE_MCS_MESSAGE"/>
</intent-filter>
</service>

<service
android:exported="true"
android:name="com.heytap.msp.push.service.CompatibleDataMessageCallbackService"
android:permission="com.coloros.mcs.permission.SEND_MCS_MESSAGE">
<intent-filter>
	<action android:name="com.coloros.mcs.action.RECEIVE_MCS_MESSAGE"/>
</intent-filter>
</service>

<service
android:exported="true"
android:name="com.heytap.msp.push.service.DataMessageCallbackService"
android:permission="com.heytap.mcs.permission.SEND_PUSH_MESSAGE">
<intent-filter>
	<action android:name="com.heytap.mcs.action.RECEIVE_MCS_MESSAGE"/>
	<action android:name="com.heytap.msp.push.RECEIVE_MCS_MESSAGE"/>
</intent-filter>
</service>
```



### FCM 谷歌
#### 推送服务和广播

```xml
<service
		android:exported="false"
		android:name="com.netease.nimlib.mixpush.fcm.FCMTokenService">
	<intent-filter>
		<action android:name="com.google.firebase.MESSAGING_EVENT"/>
	</intent-filter>
</service>
```

### 华为

#### 推送服务和广播

```xml

<service
		android:exported="false"
		android:name="com.netease.nimlib.mixpush.hw.HWPushService">
	<intent-filter>
		<action android:name="com.huawei.push.action.MESSAGING_EVENT"/>
	</intent-filter>
</service>
```

#### 荣耀
#### 应用属性配置
<meta-data
android:name="com.hihonor.push.app_id"
android:value="你的荣耀推送appId" />

#### 推送服务和广播
```xml
 <service
		android:exported="false"
		android:name="com.netease.nimlib.mixpush.honor.HonorPushService">
	<intent-filter>
		<action android:name="com.hihonor.push.action.MESSAGING_EVENT"/>
	</intent-filter>
</service>
```

## 依赖安装

### 小米

请至官网下载 MiPush_SDK_Client_6_0_1-C_3rd.aar，添加到 android/app/libs 目录下。或者拷贝 nimpush/libs 文件夹下的 小米推送 SDK，并拷贝到 android/app/libs 目录下。


### 魅族

请在 android/app/build.gradle 文件 dependencies 添加 
    `implementation 'com.meizu.flyme.internet:push-internal:4.3.0'`；

### vivo

请至官网下载 vivo_pushSDK_v4.0.4.0_504.aar，添加到 android/app/libs 目录下。或者拷贝 nimpush/libs 文件夹下的 vivo 推送 SDK,并拷贝到 android/app/libs 目录下。

### OPPO

请至官网下载 com.heytap.msp_3.5.1.aar，添加到 android/app/libs 目录下。或者拷贝 nimpush/libs 文件夹下的 oppo 推送 SDK,并拷贝到 android/app/libs 目录下。

### FCM

请在 android/app/build.gradle 文件 dependencies 添加

```groovy
implementation 'com.google.android.gms:play-services-base:18.5.0'
implementation 'com.google.firebase:firebase-messaging:24.0.0'
```

在 android/app/build.gradle 文件末尾添加

```groovy
apply plugin: 'com.google.gms.google-services'
```

将FCM 生成的 `google-services.json` 添加到 android/app 根目录。

此外，在 android/build.gradle，在 buildscript > dependencies 中增加插件配置。

```groovy
classpath 'com.google.gms:google-services:4.3.15'
```

### 华为

在 android/app/build.gradle 文件 dependencies 添加

```groovy
implementation 'com.huawei.hms:push:6.12.0.300'
```
在 android/app/build.gradle 文件开头添加

```groovy
apply plugin: 'com.huawei.agconnect'
```

将华为推送生成的`agconnect-services.json` 添加到 app 根目录。同时 keystore 文件应该和 agconnect-services.json 文件相对应。若不对应，在 IM 登录后，会报 Failed to check the Fingerprint 错误

此外，在 android/build.gradle 文件，在 buildscript > dependencies 中增加 AGC 插件配置。

```groovy
classpath("com.android.tools.build:gradle:4.2.2")
classpath 'com.huawei.agconnect:agcp:1.6.0.300'
```

在 android/build.gradle 的 allprojects 的 repositories 节点下，添加

```groovy
maven {url 'https://developer.huawei.com/repo' }
```

### 荣耀

在 android/app/build.gradle 文件 dependencies 添加

```groovy
implementation 'com.hihonor.mcs:push:7.0.61.303'
```

将荣耀推送生成的`mcs-services.json` 添加到 app 根目录。

此外，在工程根目录的 gradle 文件中，在allprojects的 repositories 节点下，添加

```groovy
maven {url 'https://developer.hihonor.com/repo'}
```

### 其它
如果在 打包安卓 app 时，遇到如下错误:
```
Failed to apply plugin 'com.huawei.agconnect'. > API 'android.registerTransform' is removed
```

这是因为华为 SDK 和 gradle 8.0 不兼容导致的。修复此问题可以在 根目录的 gradle.properties 中添加下面属性。详情请参考:https://developer.huawei.com/consumer/en/doc/AppGallery-connect-Guides/agc-common-faq-0000001063210244
```
apmsInstrumentationEnabled=false
```

## JS引入
在 js 文件中引入插件。注意 安卓和IOS插件需要使用不同的库

```js
// PushPlugin.android.tsx
import {NativeModules} from 'react-native'
export default NativeModules.NIMPushModule

// PushPlugin.ios.tsx
import PushNotificationIOS from '@react-native-community/push-notification-ios'
export default PushNotificationIOS

// App.tsx
import PushPlugin from './PushPlugin'
nim.V2NIMSettingService.setOfflinePushConfig(PushPlugin, config)
```
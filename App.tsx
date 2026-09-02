import React, {useCallback, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  KeyboardAvoidingView,
  DeviceEventEmitter,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import PushPlugin from './components/PushPlugin';
import {configureOfflinePush} from './components/offlinePush';
import {
  DEFAULT_ACCOUNT,
  DEFAULT_APPKEY,
  DEFAULT_CONVERSATION_TARGET_ACCOUNT,
  RN_PACKAGE_NAME,
  STATIC_TOKEN,
} from './config';
import NIMSDK from 'nim-web-sdk-ng/dist/v2/NIM_RN_SDK';

const RN_MAIN_ACTIVITY = `${RN_PACKAGE_NAME}.MainActivity`;
type NimInstance = InstanceType<typeof NIMSDK> & {
  destroy: () => Promise<void>;
};

const STORAGE_KEYS = {
  account: 'rn-offline-push-playground.accountId',
  appkey: 'rn-offline-push-playground.appkey',
} as const;

type LogEntry = {
  color: string;
  content: string;
  id: string;
};

type NimConsoleLogLevel = 'log' | 'warn' | 'error';

type IOSPushNotification = {
  getActionIdentifier?: () => unknown;
  getData?: () => unknown;
};

type IOSPushNotificationModule = {
  addEventListener?: (
    type: 'localNotification' | 'notification',
    handler: (notification: IOSPushNotification) => void,
  ) => void;
  getInitialNotification?: () => Promise<IOSPushNotification | null>;
  removeEventListener?: (type: 'localNotification' | 'notification') => void;
};

function App(): React.JSX.Element {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT);
  const [appkey, setAppkey] = useState(DEFAULT_APPKEY);
  const [conversationTargetAccount, setConversationTargetAccount] = useState(
    DEFAULT_CONVERSATION_TARGET_ACCOUNT,
  );
  const [connState, setConnState] = useState('disconnect');
  const [usingP8Certificate, setUsingP8Certificate] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logRef = useRef<ScrollView>(null);
  const nimRef = useRef<NimInstance | null>(null);
  const removeNimListenersRef = useRef<(() => void) | null>(null);

  const appendLog = useCallback((content: string, color = '#667085') => {
    setLogs(current =>
      [
        ...current,
        {
          color,
          content,
          id: `${Date.now()}-${current.length}`,
        },
      ].slice(-1000),
    );
  }, []);

  const appendNimLog = useCallback(
    (content: string, color = '#667085', level: NimConsoleLogLevel = 'log') => {
      appendLog(content, color);
      const consoleContent = `[NIM] ${content}`;
      if (level === 'error') {
        console.error(consoleContent);
      } else if (level === 'warn') {
        console.warn(consoleContent);
      } else {
        console.log(consoleContent);
      }
    },
    [appendLog],
  );

  useEffect(() => {
    let isActive = true;

    const restoreCredentials = async () => {
      try {
        const [storedAccount, storedAppkey] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.account),
          AsyncStorage.getItem(STORAGE_KEYS.appkey),
        ]);

        if (!isActive) {
          return;
        }

        if (storedAccount) {
          setAccount(storedAccount);
        }
        if (storedAppkey) {
          setAppkey(storedAppkey);
        }
        if (storedAccount || storedAppkey) {
          appendLog('已恢复上次使用的账号和 appkey');
        }
      } catch (error) {
        if (isActive) {
          appendLog(`恢复账号和 appkey 失败: ${formatError(error)}`, '#B54708');
        }
      }
    };

    restoreCredentials();

    return () => {
      isActive = false;
      removeNimListenersRef.current?.();
      const nim = nimRef.current;
      nimRef.current = null;
      if (nim) {
        nim.destroy().catch(() => undefined);
      }
    };
  }, [appendLog]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const pushModule = PushPlugin as {
      getPendingPushClick?: () => Promise<unknown>;
    };
    const subscription = DeviceEventEmitter.addListener(
      'NIMPushNotificationClick',
      payload => {
        appendNimLog(`收到 Android 推送点击参数: ${formatLogValue(payload)}`);
      },
    );

    const pendingPushClick = pushModule.getPendingPushClick?.();
    pendingPushClick
      ?.then(payload => {
        if (payload) {
          appendNimLog(
            `收到 Android 冷启动推送点击参数: ${formatLogValue(payload)}`,
          );
        }
      })
      .catch(error => {
        appendNimLog(
          `读取 Android 推送点击参数失败: ${formatError(error)}`,
          '#B42318',
          'error',
        );
      });

    return () => subscription.remove();
  }, [appendNimLog]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    let isActive = true;
    const pushModule = PushPlugin as IOSPushNotificationModule;
    const addEventListener = pushModule.addEventListener;
    const getInitialNotification = pushModule.getInitialNotification;
    const removeEventListener = pushModule.removeEventListener;
    const logNotificationClick = (
      prefix: string,
      notification: IOSPushNotification,
    ) => {
      appendNimLog(
        `${prefix}: ${formatLogValue({
          data: notification.getData?.(),
          actionIdentifier: notification.getActionIdentifier?.(),
        })}`,
      );
    };

    // didReceiveNotificationResponse is exposed by this library as a
    // localNotification event, including when the response launches the app.
    addEventListener?.('localNotification', notification => {
      logNotificationClick('收到 iOS 推送点击参数', notification);
    });

    const initialNotification = getInitialNotification?.();
    initialNotification
      ?.then(notification => {
        if (isActive && notification) {
          logNotificationClick('收到 iOS 冷启动推送点击参数', notification);
        }
      })
      .catch(error => {
        if (isActive) {
          appendNimLog(
            `读取 iOS 冷启动推送点击参数失败: ${formatError(error)}`,
            '#B42318',
            'error',
          );
        }
      });

    return () => {
      isActive = false;
      removeEventListener?.('localNotification');
    };
  }, [appendNimLog]);

  const connect = async () => {
    if (!account.trim() || !appkey.trim()) {
      appendLog('请先填写账号ID和 appkey', '#B54708');
      return;
    }

    if (!STATIC_TOKEN || STATIC_TOKEN === '*********') {
      appendLog('请先在 config.ts 中填写 STATIC_TOKEN', '#B54708');
      return;
    }

    if (nimRef.current) {
      appendLog('NIM 实例已存在，请先销毁当前连接', '#B54708');
      return;
    }

    setConnState('connecting');

    try {
      const nim = NIMSDK.getInstance(
        {
          appkey: appkey.trim(),
          apiVersion: 'v2',
          debugLevel: 'debug',
        },
        {
          loggerConfig: {
            debugLevel: 'debug',
            logFunc: {
              debug: (...args: any[]) => appendNimLog(formatLogArgs(args)),
              log: (...args: any[]) => appendNimLog(formatLogArgs(args)),
              warn: (...args: any[]) =>
                appendNimLog(formatLogArgs(args), '#B54708', 'warn'),
              error: (...args: any[]) =>
                appendNimLog(formatLogArgs(args), '#B42318', 'error'),
            },
          },
        },
      ) as NimInstance;

      nimRef.current = nim;
      removeNimListenersRef.current = bindNimListeners(
        nim,
        appendNimLog,
        setConnState,
      );

      configureOfflinePush(nim);
      appendNimLog('NIM 实例创建完成，离线推送配置完成');

      await nim.V2NIMLoginService.login(account.trim(), STATIC_TOKEN, {
        retryCount: 3,
        timeout: 60000,
        forceMode: false,
        authType: 0,
      });

      setConnState('connected');
      appendNimLog(
        `登录成功: ${nim.V2NIMLoginService.getLoginUser()}`,
        '#067647',
      );

      try {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.account, account.trim()],
          [STORAGE_KEYS.appkey, appkey.trim()],
        ]);
        appendLog('账号和 appkey 已持久化保存');
      } catch (error) {
        appendLog(`账号和 appkey 保存失败: ${formatError(error)}`, '#B54708');
      }
    } catch (error) {
      setConnState('disconnect');
      appendNimLog(`连接或登录失败: ${formatError(error)}`, '#B42318', 'error');
      removeNimListenersRef.current?.();
      removeNimListenersRef.current = null;
      const failedNim = nimRef.current;
      nimRef.current = null;
      if (failedNim) {
        await failedNim.destroy().catch(() => undefined);
      }
    }
  };

  const destroy = async () => {
    const nim = nimRef.current;
    if (!nim) {
      setConnState('disconnect');
      appendNimLog('当前没有可销毁的 NIM 实例', '#667085', 'warn');
      return;
    }

    try {
      await nim.destroy();
      appendNimLog('连接已销毁');
    } catch (error) {
      appendNimLog(`销毁连接失败: ${formatError(error)}`, '#B42318', 'error');
    } finally {
      removeNimListenersRef.current?.();
      removeNimListenersRef.current = null;
      nimRef.current = null;
      setConnState('disconnect');
    }
  };

  const sendMessage = async () => {
    const nim = nimRef.current;
    if (!nim || nim.V2NIMLoginService.getLoginStatus() !== 1) {
      appendNimLog('尚未登录，暂不能发送消息', '#B42318', 'error');
      return;
    }

    const senderAccount = account.trim();
    const targetAccount = conversationTargetAccount.trim();
    if (!senderAccount || !targetAccount) {
      appendNimLog('请先填写本账号和聊天对方账号', '#B54708', 'warn');
      return;
    }

    const conversationId = `${senderAccount}|1|${targetAccount}`;

    try {
      const senderId = nim.V2NIMLoginService.getLoginUser();
      const receiverId = nim.V2NIMConversationIdUtil.parseConversationTargetId(
        conversationId.trim(),
      );
      const conversationType = Number(
        nim.V2NIMConversationIdUtil.parseConversationType(
          conversationId.trim(),
        ),
      );

      if (![1, 2, 3].includes(conversationType)) {
        throw new Error(`不支持的会话类型: ${conversationType}`);
      }

      const sessionId = conversationType === 1 ? senderId : receiverId;
      const sessionType =
        conversationType === 1 ? '0' : conversationType === 2 ? '1' : '5';
      const pushPayload = createPushPayload(sessionId, sessionType);
      const message = nim.V2NIMMessageCreator.createTextMessage('hello world');
      const result = await nim.V2NIMMessageService.sendMessage(
        message,
        conversationId.trim(),
        {
          pushConfig: {
            pushEnabled: true,
            pushPayload,
          },
        },
      );

      appendNimLog(`消息发送成功: ${formatLogValue(result)}`, '#067647');
    } catch (error) {
      appendNimLog(`发送消息失败: ${formatError(error)}`, '#B42318', 'error');
    }
  };

  const applyNotificationPermission = async () => {
    if (Platform.OS !== 'ios') {
      appendLog('通知权限申请按钮仅适用于 iOS', '#B54708');
      return;
    }

    try {
      const notificationPlugin = PushPlugin as {
        requestPermissions?: () => Promise<unknown>;
      };
      const result = await notificationPlugin.requestPermissions?.();
      appendLog(`iOS 通知权限结果: ${JSON.stringify(result)}`);
    } catch (error) {
      appendLog(`iOS 通知权限申请失败: ${String(error)}`, '#B42318');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.label}>账号ID:</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setAccount}
              placeholder="请输入账号ID"
              placeholderTextColor="#98A2B3"
              style={styles.input}
              value={account}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>appkey:</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setAppkey}
              placeholder="请输入 appkey"
              placeholderTextColor="#98A2B3"
              style={styles.input}
              value={appkey}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>使用p8证书:</Text>
            <View style={styles.field}>
              <Switch
                onValueChange={value => {
                  setUsingP8Certificate(value);
                  appendLog(`P8 证书已${value ? '启用' : '关闭'}`);
                }}
                value={usingP8Certificate}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>当前状态:</Text>
            <View style={styles.field}>
              <Text style={styles.stateText}>{connState}</Text>
            </View>
          </View>

          <View style={styles.centerSection}>
            <View style={styles.actions}>
              <ActionButton
                label="连接"
                onPress={connect}
                style={styles.connectButton}
              />
              <ActionButton
                label="销毁"
                onPress={destroy}
                style={styles.destroyButton}
              />
              <ActionButton
                label="清空日志"
                onPress={() => setLogs([])}
                style={styles.destroyButton}
              />
              <ActionButton
                label="IOS申请通知权限"
                onPress={applyNotificationPermission}
                style={styles.destroyButton}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>聊天对方账号:</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setConversationTargetAccount}
              placeholder="请输入对方账号ID"
              placeholderTextColor="#98A2B3"
              style={styles.input}
              value={conversationTargetAccount}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>当前会话ID:</Text>
            <View style={styles.field}>
              <Text style={styles.stateText}>
                {account.trim() && conversationTargetAccount.trim()
                  ? `${account.trim()}|1|${conversationTargetAccount.trim()}`
                  : '请先填写本账号和对方账号'}
              </Text>
            </View>
          </View>

          <View style={styles.centerSection}>
            <ActionButton
              label="发一条消息"
              onPress={sendMessage}
              style={styles.connectButton}
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.logContent}
            nestedScrollEnabled
            onContentSizeChange={() =>
              logRef.current?.scrollToEnd({animated: true})
            }
            ref={logRef}
            style={styles.logWrap}>
            {logs.length === 0 ? (
              <Text style={styles.emptyLog}>暂无日志</Text>
            ) : (
              logs.map(log => (
                <Text key={log.id} style={[styles.log, {color: log.color}]}>
                  {log.content}
                </Text>
              ))
            )}
          </ScrollView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function bindNimListeners(
  nim: NimInstance,
  appendLog: (
    content: string,
    color?: string,
    level?: NimConsoleLogLevel,
  ) => void,
  setConnState: React.Dispatch<React.SetStateAction<string>>,
): () => void {
  const loginService = nim.V2NIMLoginService;

  const onLoginStatus = (status: any) => {
    const state = ['disconnect', 'connected', 'connecting'][status];
    if (state) {
      setConnState(state);
    }
    appendLog(`收到 V2NIMLoginService 模块的 onLoginStatus 事件: ${status}`);
  };

  const onConnectStatus = (status: any) => {
    const state = ['disconnect', 'connected', 'connecting', 'waiting'][status];
    if (state) {
      setConnState(state);
    }
    appendLog(`收到 V2NIMLoginService 模块的 onConnectStatus 事件: ${status}`);
  };

  const onLoginFailed = (error: any) => {
    setConnState('disconnect');
    appendLog(`NIM 登录失败: ${formatError(error)}`, '#B42318', 'error');
  };

  const onConnectFailed = (error: any) => {
    setConnState('disconnect');
    appendLog(`NIM 连接失败: ${formatError(error)}`, '#B42318', 'error');
  };

  const onDisconnected = (error: any) => {
    setConnState('disconnect');
    appendLog(`NIM 连接断开: ${formatError(error)}`, '#B54708');
  };

  const onKickedOffline = (detail: any) => {
    setConnState('disconnect');
    appendLog(`当前账号被踢下线: ${formatLogValue(detail)}`, '#B54708', 'warn');
  };

  loginService.on('onLoginStatus', onLoginStatus);
  loginService.on('onConnectStatus', onConnectStatus);
  loginService.on('onLoginFailed', onLoginFailed);
  loginService.on('onConnectFailed', onConnectFailed);
  loginService.on('onDisconnected', onDisconnected);
  loginService.on('onKickedOffline', onKickedOffline);

  return () => {
    loginService.off('onLoginStatus', onLoginStatus);
    loginService.off('onConnectStatus', onConnectStatus);
    loginService.off('onLoginFailed', onLoginFailed);
    loginService.off('onConnectFailed', onConnectFailed);
    loginService.off('onDisconnected', onDisconnected);
    loginService.off('onKickedOffline', onKickedOffline);
  };
}

function createPushPayload(sessionId: string, sessionType: string): string {
  const mainActivityIntent =
    `intent:#Intent;action=android.intent.action.MAIN;component=${RN_PACKAGE_NAME}/${RN_MAIN_ACTIVITY};` +
    `launchFlags=0x04000000;i.sessionType=${sessionType};S.sessionId=${sessionId};end`;

  return JSON.stringify({
    notify_effect: '2',
    intent_uri: mainActivityIntent,
    hwField: {
      click_action: {
        type: 1,
        intent: mainActivityIntent,
      },
      androidConfig: {
        category: 'IM',
      },
    },
    honorField: {
      notification: {
        clickAction: {
          type: 1,
          intent: `intent://com.honor.push/deeplink?#Intent;scheme=pushscheme;launchFlags=0x04000000;i.sessionType=${sessionType};S.sessionId=${sessionId};end`,
        },
        importance: 'NORMAL',
      },
    },
    vivoField: {
      skipType: '4',
      skipContent: mainActivityIntent,
      classification: '1',
      category: 'IM',
    },
    oppoField: {
      channel_id: '',
      category: 'IM',
      notify_level: 2,
      click_action_type: '4',
      click_action_activity: RN_MAIN_ACTIVITY,
      action_parameters: JSON.stringify({sessionType, sessionId}),
    },
    fcmFieldV1: {
      message: {
        android: {
          priority: 'high',
          data: {
            sessionType,
            sessionId,
          },
          notification: {
            click_action: 'android.intent.action.MAIN',
          },
        },
      },
    },
    harmonyField: JSON.stringify({
      payload: {
        notification: {
          clickAction: {
            actionType: 0,
            data: {
              sessionId,
              sessionType,
            },
          },
        },
      },
    }),
    sessionId,
    sessionType,
  });
}

function formatLogArgs(args: any[]): string {
  return args.map(formatLogValue).join(' ');
}

function formatLogValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === undefined) {
    return 'undefined';
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
  } catch {
    return String(value);
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return formatLogValue(error);
}

type ActionButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  style: object;
};

function ActionButton({
  label,
  onPress,
  style,
}: ActionButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.actionButton,
        style,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  section: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
    minHeight: 48,
  },
  label: {
    color: '#344054',
    fontSize: 15,
    paddingRight: 8,
    textAlign: 'right',
    width: '40%',
  },
  field: {
    alignItems: 'flex-start',
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  input: {
    borderColor: '#D0D5DD',
    borderRadius: 4,
    borderWidth: 1,
    color: '#101828',
    flex: 1,
    fontSize: 15,
    height: 40,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  stateText: {
    color: '#667085',
    fontSize: 15,
  },
  centerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 460,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 4,
    justifyContent: 'center',
    margin: 4,
    minHeight: 40,
    minWidth: 100,
    paddingHorizontal: 12,
  },
  connectButton: {
    backgroundColor: '#1677FF',
  },
  destroyButton: {
    backgroundColor: '#8B5E3C',
  },
  pressed: {
    opacity: 0.7,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logWrap: {
    backgroundColor: '#F8F9FB',
    borderColor: '#E4E7EC',
    borderRadius: 4,
    borderWidth: 1,
    maxHeight: 420,
    minHeight: 220,
  },
  logContent: {
    padding: 10,
  },
  emptyLog: {
    color: '#98A2B3',
    fontSize: 13,
  },
  log: {
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 5,
  },
});

export default App;

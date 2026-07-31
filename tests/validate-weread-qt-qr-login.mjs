import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const header = fs.readFileSync('apps/weread-qt/account_store.h', 'utf8');
const source = fs.readFileSync('apps/weread-qt/account_store.cpp', 'utf8');
const qml = fs.readFileSync('apps/weread-qt/Main.qml', 'utf8');
const qrLogin = fs.readFileSync('apps/weread-qt/QrLoginScreen.qml', 'utf8');
const cmake = fs.readFileSync('apps/weread-qt/CMakeLists.txt', 'utf8');
const helper = fs.readFileSync('apps/weread-move/tools/login-qr.lua', 'utf8');
const renewHelper = fs.readFileSync('apps/weread-move/tools/renew-cookie.lua', 'utf8');
const logoutHelper = fs.readFileSync('apps/weread-move/tools/logout.lua', 'utf8');
const configBridge = fs.readFileSync('apps/weread-move/lib/config_bridge.lua', 'utf8');
const clientBridge = fs.readFileSync('apps/weread-move/lib/client.lua', 'utf8');
const cookieBridge = fs.readFileSync('apps/weread-move/lib/cookie.lua', 'utf8');
const runner = fs.readFileSync('scripts/run-weread-qt-on-move.sh', 'utf8');
const installer = fs.readFileSync('scripts/install-weread-qt-appload.sh', 'utf8');

assert(header.includes('void loginSucceeded()'), 'account bridge must expose a completed-login signal');
assert(header.includes('~AccountStore() override') && source.includes('m_process.waitForFinished(1000)'), 'account bridge must reap a cancelled QR helper on app exit');
assert(source.includes('m_loginSucceededPending') && source.includes('emit loginSucceeded()'), 'completed login must be emitted only after cookies are persisted');
assert(source.includes('RM_WEREAD_LOGIN_TIMEOUT') && source.includes('180'), 'device QR login must allow enough time for phone confirmation');
assert(qml.includes('property bool showQrLogin'), 'app must own a full-screen QR login state');
assert(cmake.includes('QrLoginScreen.qml'), 'Qt build must package the QR login component');
assert(qml.includes('QrLoginScreen') && qrLogin.includes('width: 560') && qrLogin.includes('fullScreenLoginQrImage'), 'QR login must render a large high-contrast code on the Move');
assert(qrLogin.includes('signal cancelRequested()') && qrLogin.includes('signal retryRequested()'), 'QR login component must expose explicit parent actions');
assert(qml.includes('accountStore.refresh()') && qml.includes('accountInitialCheckComplete'), 'startup must check whether device login is required');
assert(qml.includes('!accountStore.cookieConfigured') && qml.includes('root.openQrLogin()'), 'missing cookies must automatically open device login');
assert(qml.includes('function onLoginSucceeded()') && qml.includes('shelfStore.refreshShelf()'), 'successful phone confirmation must close login and sync the shelf');
assert(qml.includes('selfTestMode === "qr-login-ui"') && qml.includes('qr-login-ui-selftest=ok'), 'device build must verify QR generation and rendering end to end');
assert(qml.includes('切换微信读书账号') && qml.includes('登录微信读书'), 'profile must expose an easy account switch entry');
assert(helper.includes('/api/auth/getLoginUid') && helper.includes('/api/auth/getLoginInfo'), 'QR helper must use the current WeRead web auth polling flow');
assert(helper.includes('/r/weread-skills') && helper.includes('request_follow'), 'QR helper must bootstrap the current WeRead Skill login page before requesting a uid');
assert(helper.includes('skip_cookie = true') && helper.includes('login_cookies'), 'QR helper must isolate QR-session cookies from any previously signed-in account');
assert(!helper.includes('/web/login/getuid') && !helper.includes('/web/login/getinfo') && !helper.includes('/web/login/weblogin'), 'QR helper must not use the stale legacy web login endpoints');
assert(helper.includes('/web/confirm?uid=') && helper.includes('cookies.wr_vid') && helper.includes('cookies.wr_skey'), 'QR login must use the current web confirmation URL and persist web auth cookies');
assert(helper.includes('/api/skills/apikeyGet?only_show=1') && helper.includes('api_key = api_key'), 'QR login must retrieve and persist the official WeRead Skill API key');
assert(renewHelper.includes('/api/skills/apikeyGet?only_show=1') && renewHelper.includes('refresh_api_key'), 'cookie renewal must repair a missing WeRead Skill API key without another QR scan');
assert(!helper.includes('state = "qr", uid = uid'), 'QR helper must not duplicate the private login uid in its machine-readable output');
assert(clientBridge.includes('require("weread.lib.client")'), 'Qt helpers must bridge the current namespaced weread.koplugin client module');
assert(cookieBridge.includes('require("weread.lib.cookie")') && cookieBridge.includes('parse_cookie_header') && cookieBridge.includes('extract_from_curl'), 'Qt helpers must bridge current cookie handling while retaining legacy config import support');
assert(configBridge.includes('function ConfigBridge:update_auth') && configBridge.includes('function ConfigBridge:merge_set_cookie'), 'ConfigBridge must implement the current client settings contract');
assert(source.includes('手机已确认，正在保存登录态'), 'account bridge must show a separate session-save stage after phone confirmation');
assert(header.includes('Q_INVOKABLE void logout()') && header.includes('void loggedOut()'), 'account bridge must expose logout and completion');
assert(logoutHelper.includes('config:set("logged_out", true)') && logoutHelper.includes('cache_preserved = true'), 'logout must revoke only runtime authentication');
assert(configBridge.includes('session.logged_out == true') && configBridge.includes('if not self.values.logged_out then'), 'logged-out marker must override imported legacy cookies');
assert(configBridge.includes('api_key = has_text(values.api_key)') && configBridge.includes('has_text(session.api_key)'), 'session persistence must retain a QR-retrieved API key');
assert(helper.includes('logged_out = false'), 'successful QR login must clear the logged-out marker');
assert(qml.includes('退出当前账号') && qml.includes('function onLoggedOut()'), 'profile logout must open a fresh QR flow');
assert(runner.includes('tools/logout.lua'), 'device deployment must include logout helper');
assert(installer.includes('logout.lua') && installer.includes('helper/tools/$tool'), 'persistent app installation must include logout helper');

console.log('weread Qt QR login ok');

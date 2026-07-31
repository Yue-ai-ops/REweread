io.stdout:setvbuf("line")
os.setlocale("C", "numeric")

local app_dir = os.getenv("RM_WEREAD_APP_DIR") or "/home/root/xovi/exthome/appload/weread-move"
local koreader_dir = os.getenv("KO_DIR") or "/home/root/xovi/exthome/appload/koreader"
package.path = app_dir .. "/?.lua;" .. app_dir .. "/lib/?.lua;" .. app_dir .. "/views/?.lua;" .. app_dir .. "/tools/?.lua;" .. package.path
package.path =
    app_dir .. "/../../third_party/weread.koplugin/?.lua;" ..
    app_dir .. "/../../third_party/weread.koplugin/lib/?.lua;" ..
    "/home/root/xovi/exthome/appload/koreader/plugins/weread.koplugin/?.lua;" ..
    "/home/root/xovi/exthome/appload/koreader/plugins/weread.koplugin/lib/?.lua;" ..
    package.path

local KoreaderPaths = require("koreader_paths")
KoreaderPaths.append(koreader_dir)

local ConfigBridge = require("config_bridge")
local Client = require("lib.client")
local Json = require("json_util")

local function emit(row)
    print(Json.encode(row))
end

local function missing_login_message()
    return "微信读书登录 Cookie 未配置。请在微信读书 App 的账号页使用扫码登录，或点续期 Cookie 后再重试。"
end

local function header_value(headers, name)
    local target = tostring(name or ""):lower()
    for key, value in pairs(headers or {}) do
        if tostring(key):lower() == target then
            return value
        end
    end
    return nil
end

local function refresh_api_key(client, config)
    if config:is_api_configured() then
        return
    end
    local cookies = config:get("cookies", {})
    local text, code, headers = client:request({
        url = "https://weread.qq.com/api/skills/apikeyGet?only_show=1",
        method = "GET",
        timeout = { 10, 20 },
        headers = {
            ["Accept"] = "application/json, text/plain, */*",
            ["Referer"] = "https://weread.qq.com/r/weread-skills",
            ["X-Vid"] = tostring(cookies.wr_vid or ""),
            ["X-Skey"] = tostring(cookies.wr_skey or ""),
        },
    })
    if not code or code < 200 or code >= 300 then
        error("微信读书 Skill API 凭据获取失败。")
    end
    config:merge_set_cookie(header_value(headers, "set-cookie"))
    local result = client:json_decode(text or "")
    local api_key = type(result) == "table" and result.apikey or ""
    if type(api_key) ~= "string" or api_key == "" then
        error("微信读书 Skill 尚未启用 API 凭据。")
    end
    config:update_auth({ api_key = api_key })
end

local ok, result = pcall(function()
    local config = ConfigBridge:new()
    if not config:is_cookie_configured() then
        error(missing_login_message())
    end

    local client = Client:new(config)
    client:renew_cookie()
    refresh_api_key(client, config)
    config:flush()

    local status = config:redacted_status()
    status.state = "done"
    status.cookie_valid = config:is_cookie_configured()
    return status
end)

if ok then
    emit(result)
else
    emit({ state = "error", message = tostring(result or "unknown") })
    os.exit(1)
end

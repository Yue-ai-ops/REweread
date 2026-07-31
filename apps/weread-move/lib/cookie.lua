local Cookie = require("weread.lib.cookie")

function Cookie.parse_cookie_header(header)
    local cookies = {}
    for part in tostring(header or ""):gmatch("[^;]+") do
        local name, value = part:match("^%s*([^=;%s]+)%s*=%s*(.-)%s*$")
        if name and value then
            cookies[name] = value
        end
    end
    return cookies
end

function Cookie.extract_from_curl(command)
    local text = tostring(command or "")
    local header = text:match("[Cc]ookie:%s*([^'\"\r\n]+)")
        or text:match("[Cc]ookie:%s*'([^']+)'")
        or text:match('[Cc]ookie:%s*"([^"]+)"')
    return header and header:gsub("%s+$", "") or ""
end

return Cookie

-- The current plugin client is reusable outside KOReader, but its diagnostics
-- normally initialize the full display/input stack. Qt helpers only need HTTP,
-- so provide process-local headless adapters before loading the namespaced
-- module.
local ltn12 = require("ltn12")
local http = require("socket.http")
local https = require("ssl.https")

package.loaded.socketutil = {
    set_timeout = function(_, block_timeout)
        http.TIMEOUT = block_timeout or 15
        https.TIMEOUT = block_timeout or 15
    end,
    reset_timeout = function()
        http.TIMEOUT = 60
        https.TIMEOUT = 60
    end,
    table_sink = function(target)
        return ltn12.sink.table(target)
    end,
}

local quiet_logger = {
    info = function() end,
    warn = function() end,
    err = function() end,
}
quiet_logger.scoped = function()
    return quiet_logger
end
package.loaded["weread.lib.logger"] = quiet_logger

return require("weread.lib.client")

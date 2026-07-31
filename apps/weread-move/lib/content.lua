-- Keep the Qt helper API stable while weread.koplugin uses namespaced modules.
-- KOReader normally installs ffi.loadlib from setupkoenv.lua. Standalone Qt
-- helpers only append KOReader's module paths, so initialize this small loader
-- explicitly before content packaging reaches ffi.archiver.
require("ffi/loadlib")

return require("weread.lib.content")

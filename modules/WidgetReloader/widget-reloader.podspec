Pod::Spec.new do |s|
  s.name           = "widget-reloader"
  s.version        = "1.0.0"
  s.swift_version  = "5.9"
  s.ios.deployment_target = "17.0"
  s.source_files   = "ios/**/*.swift"
  s.dependency       "ExpoModulesCore"
  s.ios.frameworks = "WidgetKit"
end

Pod::Spec.new do |s|
  s.name           = "widget-reloader"
  s.version        = "1.0.0"
  s.summary        = "Reloads WidgetKit timelines from the main app."
  s.homepage       = "https://github.com/elion004/water-tracker"
  s.license        = { :type => "MIT" }
  s.authors        = { "WaterTrack" => "elion004@icloud.com" }
  s.source         = { :git => "https://github.com/elion004/water-tracker.git", :tag => s.version.to_s }
  s.platform       = :ios, "17.0"
  s.swift_version  = "5.9"
  s.source_files   = "ios/**/*.swift"
  s.dependency     "ExpoModulesCore"
  s.frameworks     = "WidgetKit"
end

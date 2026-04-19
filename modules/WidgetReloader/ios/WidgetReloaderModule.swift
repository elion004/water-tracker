import ExpoModulesCore
import WidgetKit

public class WidgetReloaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetReloader")

    Function("reloadAll") {
      UserDefaults(suiteName: "group.com.elionbajrami.watertracker")?.synchronize()
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

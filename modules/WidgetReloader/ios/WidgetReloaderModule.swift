import ExpoModulesCore
import WidgetKit

public class WidgetReloaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetReloader")

    Function("reloadAll") {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

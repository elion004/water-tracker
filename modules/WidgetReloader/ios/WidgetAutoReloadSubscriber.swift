import ExpoModulesCore
import WidgetKit

public class WidgetAutoReloadSubscriber: ExpoAppDelegateSubscriber {
  private var observer: NSObjectProtocol?

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    observer = NotificationCenter.default.addObserver(
      forName: UserDefaults.didChangeNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      WidgetCenter.shared.reloadAllTimelines()
    }
    return true
  }
}

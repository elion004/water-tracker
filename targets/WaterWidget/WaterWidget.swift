import AppIntents
import WidgetKit
import SwiftUI

// MARK: - Pending Entry

struct PendingEntry: Codable {
    let amountMl: Int
    let timestamp: String
}

// MARK: - App Intent

struct AddWaterIntent: AppIntent {
    static var title: LocalizedStringResource = "Wasser hinzufügen"
    static var description = IntentDescription("Fügt Wasser zum Tagesziel hinzu.")

    @Parameter(title: "Menge (ml)")
    var amountMl: Int

    init() { self.amountMl = 250 }
    init(amountMl: Int) { self.amountMl = amountMl }

    private let appGroup = "group.com.elionbajrami.watertracker"
    private let widgetKey = "waterWidgetData"
    private let pendingKey = "waterWidgetPending"

    func perform() async throws -> some IntentResult {
        guard let defaults = UserDefaults(suiteName: appGroup) else {
            return .result()
        }

        if let json = defaults.string(forKey: widgetKey),
           let data = json.data(using: .utf8),
           var decoded = try? JSONDecoder().decode(WaterWidgetData.self, from: data) {
            let today = todayDateString()
            if decoded.date != today {
                decoded.totalMl = 0
                decoded.date = today
            }
            decoded.totalMl += amountMl
            decoded.lastUpdated = ISO8601DateFormatter().string(from: Date())
            if let encoded = try? JSONEncoder().encode(decoded),
               let str = String(data: encoded, encoding: .utf8) {
                defaults.set(str, forKey: widgetKey)
            }
        }

        var pending: [PendingEntry] = []
        if let json = defaults.string(forKey: pendingKey),
           let data = json.data(using: .utf8),
           let decoded = try? JSONDecoder().decode([PendingEntry].self, from: data) {
            pending = decoded
        }
        pending.append(PendingEntry(
            amountMl: amountMl,
            timestamp: ISO8601DateFormatter().string(from: Date())
        ))
        if let encoded = try? JSONEncoder().encode(pending),
           let str = String(data: encoded, encoding: .utf8) {
            defaults.set(str, forKey: pendingKey)
        }

        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// MARK: - Data Model

private func todayDateString() -> String {
    let fmt = DateFormatter()
    fmt.dateFormat = "yyyy-MM-dd"
    return fmt.string(from: Date())
}

struct WaterWidgetData: Codable {
    var totalMl: Int
    var goalMl: Int
    var streak: Int
    var lastUpdated: String
    var date: String

    static var placeholder: WaterWidgetData {
        WaterWidgetData(totalMl: 1400, goalMl: 2000, streak: 5, lastUpdated: "", date: todayDateString())
    }
    static var empty: WaterWidgetData {
        WaterWidgetData(totalMl: 0, goalMl: 2000, streak: 0, lastUpdated: "", date: todayDateString())
    }
}

extension WaterWidgetData {
    var progressFraction: Double {
        guard goalMl > 0 else { return 0 }
        return min(Double(totalMl) / Double(goalMl), 1.0)
    }
    var remainingMl: Int { max(goalMl - totalMl, 0) }
    var isGoalReached: Bool { totalMl >= goalMl }

    var totalFormatted: String {
        totalMl >= 1000
            ? String(format: "%.1f L", Double(totalMl) / 1000)
            : "\(totalMl) ml"
    }
    var goalFormatted: String {
        goalMl >= 1000
            ? String(format: "%.1f L", Double(goalMl) / 1000)
            : "\(goalMl) ml"
    }
    var remainingFormatted: String {
        remainingMl >= 1000
            ? String(format: "%.1f L", Double(remainingMl) / 1000)
            : "\(remainingMl) ml"
    }
}

// MARK: - Provider

struct WaterProvider: TimelineProvider {
    private let appGroup = "group.com.elionbajrami.watertracker"
    private let widgetKey = "waterWidgetData"

    func loadData() -> WaterWidgetData {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let json = defaults.string(forKey: widgetKey),
            let data = json.data(using: .utf8),
            var decoded = try? JSONDecoder().decode(WaterWidgetData.self, from: data)
        else { return .empty }

        let today = todayDateString()
        if decoded.date != today {
            decoded.totalMl = 0
            decoded.date = today
            decoded.lastUpdated = ISO8601DateFormatter().string(from: Date())
            if let encoded = try? JSONEncoder().encode(decoded),
               let str = String(data: encoded, encoding: .utf8) {
                defaults.set(str, forKey: widgetKey)
            }
        }
        return decoded
    }

    func placeholder(in context: Context) -> WaterEntry {
        WaterEntry(date: Date(), data: .placeholder)
    }
    func getSnapshot(in context: Context, completion: @escaping (WaterEntry) -> Void) {
        completion(WaterEntry(date: Date(), data: context.isPreview ? .placeholder : loadData()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<WaterEntry>) -> Void) {
        let now = Date()
        let data = loadData()
        let entry = WaterEntry(date: now, data: data)

        let calendar = Calendar.current
        let nextMidnight = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: now)!)
        let nextFifteenMin = calendar.date(byAdding: .minute, value: 15, to: now)!
        let nextRefresh = nextFifteenMin < nextMidnight ? nextFifteenMin : nextMidnight
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}

struct WaterEntry: TimelineEntry {
    let date: Date
    let data: WaterWidgetData
}

// MARK: - Design Tokens

private let brandGreen      = Color(red: 0.114, green: 0.620, blue: 0.459)
private let brandGreenDark  = Color(red: 0.059, green: 0.431, blue: 0.337)
private let brandGreenDeep  = Color(red: 0.039, green: 0.310, blue: 0.235)

// MARK: - Widget Theme
// Adapts colors based on the widget rendering mode so text stays readable
// when the user applies a custom tint color (iOS 18+).

struct WidgetTheme {
    let text: Color
    let textDim: Color
    let ringTrack: Color
    let fill: Color
    let progressTrack: Color
    let buttonBg: Color
    let buttonLabel: Color

    // Used when the widget renders in its own full colors (default home screen).
    static let fullColor = WidgetTheme(
        text: .white,
        textDim: .white.opacity(0.7),
        ringTrack: .white.opacity(0.15),
        fill: .white,
        progressTrack: .white.opacity(0.18),
        buttonBg: .white,
        buttonLabel: brandGreenDark
    )

    // Used when iOS applies a tint (accented/vibrant rendering).
    // .primary/.secondary automatically adapt to light or dark tint backgrounds.
    static let tinted = WidgetTheme(
        text: .primary,
        textDim: .secondary,
        ringTrack: Color.primary.opacity(0.2),
        fill: .primary,
        progressTrack: Color.primary.opacity(0.2),
        buttonBg: Color.primary.opacity(0.15),
        buttonLabel: .primary
    )
}

// MARK: - Shared Components

struct RingView: View {
    let progress: Double
    let lineWidth: CGFloat
    let size: CGFloat
    let theme: WidgetTheme

    var body: some View {
        ZStack {
            Circle()
                .stroke(theme.ringTrack, lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    theme.fill,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
        }
        .frame(width: size, height: size)
    }
}

struct AddButton: View {
    let amountMl: Int
    let theme: WidgetTheme

    private var label: String {
        amountMl >= 1000
            ? String(format: "+%.0fL", Double(amountMl) / 1000)
            : "+\(amountMl)"
    }

    var body: some View {
        Button(intent: AddWaterIntent(amountMl: amountMl)) {
            HStack(spacing: 3) {
                Image(systemName: "drop.fill")
                    .font(.system(size: 9, weight: .bold))
                Text(label)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
            }
            .foregroundStyle(theme.buttonLabel)
            .padding(.horizontal, 11)
            .padding(.vertical, 7)
            .background(theme.buttonBg)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Small Widget

struct SmallWidgetView: View {
    let data: WaterWidgetData
    let theme: WidgetTheme

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            ZStack {
                RingView(progress: data.progressFraction, lineWidth: 7, size: 78, theme: theme)
                VStack(spacing: 1) {
                    Text(data.totalFormatted)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(theme.text)
                    Text("\(Int(data.progressFraction * 100))%")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundStyle(theme.textDim)
                }
            }

            Spacer().frame(height: 8)

            Group {
                if data.isGoalReached {
                    Label("Ziel erreicht!", systemImage: "checkmark.seal.fill")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundStyle(theme.text)
                } else {
                    Text("\(data.remainingFormatted) fehlen")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundStyle(theme.textDim)
                }
            }

            Spacer().frame(height: 10)

            AddButton(amountMl: 250, theme: theme)

            Spacer()
        }
        .padding(.horizontal, 12)
    }
}

// MARK: - Medium Widget

struct MediumWidgetView: View {
    let data: WaterWidgetData
    let theme: WidgetTheme

    var body: some View {
        HStack(alignment: .center, spacing: 18) {

            ZStack {
                RingView(progress: data.progressFraction, lineWidth: 9, size: 88, theme: theme)
                VStack(spacing: 2) {
                    Text(data.totalFormatted)
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundStyle(theme.text)
                    Text("von \(data.goalFormatted)")
                        .font(.system(size: 9, weight: .regular, design: .rounded))
                        .foregroundStyle(theme.textDim)
                }
            }
            .fixedSize()

            VStack(alignment: .leading, spacing: 10) {

                VStack(alignment: .leading, spacing: 5) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("Tagesziel")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(theme.textDim)
                        Spacer()
                        Text("\(Int(data.progressFraction * 100))%")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundStyle(theme.text)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(theme.progressTrack)
                                .frame(height: 5)
                            Capsule()
                                .fill(theme.fill)
                                .frame(width: geo.size.width * data.progressFraction, height: 5)
                        }
                    }
                    .frame(height: 5)
                }

                HStack {
                    if data.isGoalReached {
                        Label("Ziel erreicht!", systemImage: "checkmark.seal.fill")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(theme.text)
                    } else {
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Noch")
                                .font(.system(size: 9, design: .rounded))
                                .foregroundStyle(theme.textDim)
                            Text(data.remainingFormatted)
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(theme.text)
                        }
                    }
                    Spacer()
                    if data.streak > 0 {
                        HStack(spacing: 3) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 12))
                                .foregroundStyle(.orange)
                            VStack(alignment: .leading, spacing: 0) {
                                Text("\(data.streak)")
                                    .font(.system(size: 13, weight: .bold, design: .rounded))
                                    .foregroundStyle(theme.text)
                                Text("Tage")
                                    .font(.system(size: 8, design: .rounded))
                                    .foregroundStyle(theme.textDim)
                            }
                        }
                    }
                }

                HStack(spacing: 6) {
                    ForEach([150, 250, 500], id: \.self) { ml in
                        Button(intent: AddWaterIntent(amountMl: ml)) {
                            Text("+\(ml)")
                                .font(.system(size: 12, weight: .bold, design: .rounded))
                                .foregroundStyle(theme.buttonLabel)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 7)
                                .background(theme.buttonBg)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

// MARK: - Entry View

struct WaterWidgetEntryView: View {
    var entry: WaterEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.widgetRenderingMode) var renderingMode

    var theme: WidgetTheme {
        renderingMode == .fullColor ? .fullColor : .tinted
    }

    var body: some View {
        switch family {
        case .systemSmall:  SmallWidgetView(data: entry.data, theme: theme)
        case .systemMedium: MediumWidgetView(data: entry.data, theme: theme)
        default:            SmallWidgetView(data: entry.data, theme: theme)
        }
    }
}

// MARK: - Widget

struct WaterWidget: Widget {
    let kind: String = "WaterWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WaterProvider()) { entry in
            WaterWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    LinearGradient(
                        colors: [brandGreen, brandGreenDark, brandGreenDeep],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                }
        }
        .configurationDisplayName("WaterTrack")
        .description("Verfolge deinen täglichen Wasserkonsum.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Previews

#Preview("Small", as: .systemSmall) {
    WaterWidget()
} timeline: {
    WaterEntry(date: .now, data: .placeholder)
    WaterEntry(date: .now, data: .empty)
}

#Preview("Medium", as: .systemMedium) {
    WaterWidget()
} timeline: {
    WaterEntry(date: .now, data: .placeholder)
    WaterEntry(date: .now, data: .empty)
}

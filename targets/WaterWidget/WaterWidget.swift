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

struct WaterWidgetData: Codable {
    var totalMl: Int
    var goalMl: Int
    var streak: Int
    var lastUpdated: String

    static var placeholder: WaterWidgetData {
        WaterWidgetData(totalMl: 1400, goalMl: 2000, streak: 5, lastUpdated: "")
    }
    static var empty: WaterWidgetData {
        WaterWidgetData(totalMl: 0, goalMl: 2000, streak: 0, lastUpdated: "")
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
            let decoded = try? JSONDecoder().decode(WaterWidgetData.self, from: data)
        else { return .empty }
        return decoded
    }

    func placeholder(in context: Context) -> WaterEntry {
        WaterEntry(date: Date(), data: .placeholder)
    }
    func getSnapshot(in context: Context, completion: @escaping (WaterEntry) -> Void) {
        completion(WaterEntry(date: Date(), data: context.isPreview ? .placeholder : loadData()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<WaterEntry>) -> Void) {
        let entry = WaterEntry(date: Date(), data: loadData())
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
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

// MARK: - Shared Components

struct RingView: View {
    let progress: Double
    let lineWidth: CGFloat
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.15), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    Color.white,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
        }
        .frame(width: size, height: size)
    }
}

struct AddButton: View {
    let amountMl: Int

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
            .foregroundStyle(brandGreenDark)
            .padding(.horizontal, 11)
            .padding(.vertical, 7)
            .background(.white)
            .clipShape(Capsule())
            .shadow(color: .black.opacity(0.12), radius: 4, y: 2)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Small Widget

struct SmallWidgetView: View {
    let data: WaterWidgetData

    var body: some View {
        VStack(spacing: 0) {
                Spacer()

                // Ring + amount
                ZStack {
                    RingView(progress: data.progressFraction, lineWidth: 7, size: 78)
                    VStack(spacing: 1) {
                        Text(data.totalFormatted)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                        Text("\(Int(data.progressFraction * 100))%")
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }

                Spacer().frame(height: 8)

                // Status
                Group {
                    if data.isGoalReached {
                        Label("Ziel erreicht!", systemImage: "checkmark.seal.fill")
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundStyle(.white)
                    } else {
                        Text("\(data.remainingFormatted) fehlen")
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }

                Spacer().frame(height: 10)

                // Quick-add button
                AddButton(amountMl: 250)

                Spacer()
            }
            .padding(.horizontal, 12)
    }
}

// MARK: - Medium Widget

struct MediumWidgetView: View {
    let data: WaterWidgetData

    var body: some View {
        HStack(alignment: .center, spacing: 18) {

                // Left: Ring
                ZStack {
                    RingView(progress: data.progressFraction, lineWidth: 9, size: 88)
                    VStack(spacing: 2) {
                        Text(data.totalFormatted)
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                        Text("von \(data.goalFormatted)")
                            .font(.system(size: 9, weight: .regular, design: .rounded))
                            .foregroundStyle(.white.opacity(0.65))
                    }
                }

                // Right: Stats + buttons
                VStack(alignment: .leading, spacing: 10) {

                    // Progress row
                    VStack(alignment: .leading, spacing: 5) {
                        HStack(alignment: .firstTextBaseline) {
                            Text("Tagesziel")
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.75))
                            Spacer()
                            Text("\(Int(data.progressFraction * 100))%")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(.white.opacity(0.18))
                                    .frame(height: 5)
                                Capsule()
                                    .fill(.white)
                                    .frame(width: geo.size.width * data.progressFraction, height: 5)
                            }
                        }
                        .frame(height: 5)
                    }

                    // Status + streak
                    HStack {
                        if data.isGoalReached {
                            Label("Ziel erreicht!", systemImage: "checkmark.seal.fill")
                                .font(.system(size: 11, weight: .semibold, design: .rounded))
                                .foregroundStyle(.white)
                        } else {
                            VStack(alignment: .leading, spacing: 1) {
                                Text("Noch")
                                    .font(.system(size: 9, design: .rounded))
                                    .foregroundStyle(.white.opacity(0.65))
                                Text(data.remainingFormatted)
                                    .font(.system(size: 14, weight: .bold, design: .rounded))
                                    .foregroundStyle(.white)
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
                                        .foregroundStyle(.white)
                                    Text("Tage")
                                        .font(.system(size: 8, design: .rounded))
                                        .foregroundStyle(.white.opacity(0.65))
                                }
                            }
                        }
                    }

                    // Quick-add buttons
                    HStack(spacing: 7) {
                        AddButton(amountMl: 150)
                        AddButton(amountMl: 250)
                        AddButton(amountMl: 500)
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

    var body: some View {
        switch family {
        case .systemSmall:  SmallWidgetView(data: entry.data)
        case .systemMedium: MediumWidgetView(data: entry.data)
        default:            SmallWidgetView(data: entry.data)
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

import WidgetKit
import SwiftUI

// MARK: - Data Model

struct WaterWidgetData: Codable {
    var totalMl: Int
    var goalMl: Int
    var streak: Int
    var lastUpdated: String

    static var placeholder: WaterWidgetData {
        WaterWidgetData(totalMl: 1200, goalMl: 2000, streak: 3, lastUpdated: "")
    }

    static var empty: WaterWidgetData {
        WaterWidgetData(totalMl: 0, goalMl: 2000, streak: 0, lastUpdated: "")
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
        else {
            return .empty
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
        let entry = WaterEntry(date: Date(), data: loadData())
        // Refresh every 15 minutes or when app writes new data
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

struct WaterEntry: TimelineEntry {
    let date: Date
    let data: WaterWidgetData
}

// MARK: - Colors & Helpers

private let brandGreen = Color(red: 0.114, green: 0.620, blue: 0.459)   // #1D9E75
private let brandGreenDark = Color(red: 0.059, green: 0.431, blue: 0.337) // #0F6E56
private let brandBlue = Color(red: 0.180, green: 0.620, blue: 0.859)    // #2E9EDC

extension WaterWidgetData {
    var progressFraction: Double {
        guard goalMl > 0 else { return 0 }
        return min(Double(totalMl) / Double(goalMl), 1.0)
    }

    var remainingMl: Int {
        max(goalMl - totalMl, 0)
    }

    var isGoalReached: Bool {
        totalMl >= goalMl
    }

    var totalLiters: String {
        if totalMl >= 1000 {
            return String(format: "%.1f L", Double(totalMl) / 1000)
        }
        return "\(totalMl) ml"
    }

    var goalLiters: String {
        if goalMl >= 1000 {
            return String(format: "%.1f L", Double(goalMl) / 1000)
        }
        return "\(goalMl) ml"
    }
}

// MARK: - Progress Ring View

struct ProgressRingView: View {
    let progress: Double
    let lineWidth: CGFloat
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.2), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    Color.white,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.6), value: progress)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Small Widget

struct SmallWidgetView: View {
    let data: WaterWidgetData

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [brandGreen, brandGreenDark],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 6) {
                ZStack {
                    ProgressRingView(
                        progress: data.progressFraction,
                        lineWidth: 8,
                        size: 72
                    )
                    VStack(spacing: 1) {
                        Text(data.totalLiters)
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text("\(Int(data.progressFraction * 100))%")
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundColor(.white.opacity(0.8))
                    }
                }

                if data.isGoalReached {
                    Label("Ziel erreicht!", systemImage: "checkmark.seal.fill")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.white)
                } else {
                    Text("\(data.remainingMl) ml fehlen")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.85))
                }

                if data.streak > 0 {
                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 9))
                            .foregroundColor(.orange)
                        Text("\(data.streak) Tage")
                            .font(.system(size: 9, weight: .medium, design: .rounded))
                            .foregroundColor(.white.opacity(0.75))
                    }
                }
            }
            .padding(10)
        }
    }
}

// MARK: - Medium Widget

struct MediumWidgetView: View {
    let data: WaterWidgetData

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [brandGreen, brandGreenDark],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            HStack(spacing: 16) {
                // Left: Progress ring
                ZStack {
                    ProgressRingView(
                        progress: data.progressFraction,
                        lineWidth: 10,
                        size: 90
                    )
                    VStack(spacing: 2) {
                        Text(data.totalLiters)
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text("von \(data.goalLiters)")
                            .font(.system(size: 10, weight: .regular, design: .rounded))
                            .foregroundColor(.white.opacity(0.75))
                    }
                }

                // Right: Stats + action
                VStack(alignment: .leading, spacing: 8) {
                    // Progress bar
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("Tagesziel")
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundColor(.white.opacity(0.8))
                            Spacer()
                            Text("\(Int(data.progressFraction * 100))%")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(Color.white.opacity(0.2))
                                    .frame(height: 6)
                                Capsule()
                                    .fill(Color.white)
                                    .frame(width: geo.size.width * data.progressFraction, height: 6)
                            }
                        }
                        .frame(height: 6)
                    }

                    // Status row
                    HStack(spacing: 12) {
                        if data.isGoalReached {
                            Label("Ziel erreicht!", systemImage: "checkmark.seal.fill")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.white)
                        } else {
                            VStack(alignment: .leading, spacing: 1) {
                                Text("Noch")
                                    .font(.system(size: 10, design: .rounded))
                                    .foregroundColor(.white.opacity(0.7))
                                Text("\(data.remainingMl) ml")
                                    .font(.system(size: 13, weight: .bold, design: .rounded))
                                    .foregroundColor(.white)
                            }
                        }

                        Spacer()

                        if data.streak > 0 {
                            VStack(alignment: .trailing, spacing: 1) {
                                HStack(spacing: 3) {
                                    Image(systemName: "flame.fill")
                                        .font(.system(size: 11))
                                        .foregroundColor(.orange)
                                    Text("\(data.streak)")
                                        .font(.system(size: 13, weight: .bold, design: .rounded))
                                        .foregroundColor(.white)
                                }
                                Text("Tage")
                                    .font(.system(size: 9, design: .rounded))
                                    .foregroundColor(.white.opacity(0.7))
                            }
                        }
                    }

                    // Deep link button
                    Link(destination: URL(string: "watertracker://add")!) {
                        HStack(spacing: 4) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 12))
                            Text("Wasser hinzufügen")
                                .font(.system(size: 11, weight: .semibold, design: .rounded))
                        }
                        .foregroundColor(brandGreen)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.white)
                        .clipShape(Capsule())
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .padding(14)
        }
    }
}

// MARK: - Widget

struct WaterWidget: Widget {
    let kind: String = "WaterWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WaterProvider()) { entry in
            WaterWidgetEntryView(entry: entry)
                .containerBackground(.clear, for: .widget)
        }
        .configurationDisplayName("WaterTrack")
        .description("Verfolge deinen täglichen Wasserkonsum.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct WaterWidgetEntryView: View {
    var entry: WaterEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.data)
        case .systemMedium:
            MediumWidgetView(data: entry.data)
        default:
            SmallWidgetView(data: entry.data)
        }
    }
}

// MARK: - Previews

#Preview("Small", as: .systemSmall) {
    WaterWidget()
} timeline: {
    WaterEntry(date: .now, data: .placeholder)
    WaterEntry(date: .now, data: WaterWidgetData(totalMl: 2000, goalMl: 2000, streak: 7, lastUpdated: ""))
}

#Preview("Medium", as: .systemMedium) {
    WaterWidget()
} timeline: {
    WaterEntry(date: .now, data: .placeholder)
    WaterEntry(date: .now, data: WaterWidgetData(totalMl: 2000, goalMl: 2000, streak: 7, lastUpdated: ""))
}

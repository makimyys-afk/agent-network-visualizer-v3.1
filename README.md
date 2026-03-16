# Agent Network Visualizer v3.1

## About the Project

**Agent Network Visualizer v3.1** is a powerful tool for simulating and visualizing social networks of agents with an integrated economic system, clan mechanics, and conflict resolution. The project enables researchers and developers to explore the dynamics of connection formation, opinion propagation, economic interaction, and inter-group conflicts in agent-based systems.

## Features

- **Multi-Agent Simulation:** Model complex networks of autonomous agents with individual behaviors and attributes.
- **Economic Engine:** A fully functional economic model with resource distribution, transactions, and market dynamics.
- **Clan System:** Agents can form clans, alliances, and factions with dedicated clan statistics and management.
- **Conflict Mechanics:** Simulate inter-agent and inter-clan conflicts with realistic resolution outcomes.
- **Opinion Visualization:** Track and visualize how opinions spread and evolve across the network.
- **Enhanced Analytics:** Detailed dashboards with real-time statistics, charts, and event logs.
- **Export Utilities:** Export simulation data and results for further analysis (CSV, JSON, Markdown, PNG).
- **Responsive UI:** Built with shadcn/ui and TailwindCSS for a modern, responsive interface.

## What is New in v3.1

- Fully reworked economic model with improved balance and realistic resource distribution.
- Enhanced clan system with inter-clan conflict mechanics and 3 distribution rule types.
- New death mechanics for agents with configurable survival thresholds.
- Comprehensive test suite covering economic, death, and integration scenarios.
- Detailed documentation: balance recommendations, math audit, and final test results.

## Tech Stack

| Category | Technologies |
|:---------|:-------------|
| **Frontend** | React 18, JavaScript (JSX), Vite |
| **Styling** | TailwindCSS, shadcn/ui, Radix UI |
| **Visualization** | Three.js (3D graph), Recharts (charts) |
| **Simulation Engine** | Custom JS modules (agentSimulation, economicEngine, clanSystem, conflictMechanics) |
| **Build Tool** | Vite |

## Installation and Setup

### Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0 (or pnpm)

### Quick Start

```bash
git clone https://github.com/makimyys-afk/agent-network-visualizer-v3.1.git
cd agent-network-visualizer-v3.1
npm install
npm run dev
```

Open in browser: http://localhost:5173

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
agent-network-visualizer-v3.1/
├── src/
│   ├── App.jsx
│   ├── components/
│   ├── lib/
│   │   ├── agentSimulation.js
│   │   ├── economicEngine.js
│   │   ├── clanSystem.js
│   │   ├── conflictMechanics.js
│   │   ├── eventLogger.js
│   │   └── exportUtils.js
│   └── hooks/
├── docs/
├── public/
└── package.json
```

## Usage

1. Open the **Settings** tab and configure simulation parameters.
2. Optionally enable the **Economic Model** in the Economy tab.
3. Optionally configure **Clan and Conflict** settings in the Clans tab.
4. Click **Run Simulation** and review results in the Results, Economy, and Clans tabs.

## Economic Model

The economic engine models resource production and consumption per agent. Clan resource distribution supports three rule types: **Dictatorship** (strongest takes all surplus), **Democracy** (configurable sub-rules), and **Anarchy** (attack the weakest clan).

## Performance

| Configuration | Estimated Time |
|:-------------|:--------------|
| 150 agents x 50 cycles | ~0.1 seconds |
| 500 agents x 100 cycles | ~0.5 seconds |
| 1000 agents x 200 cycles | ~2 seconds |

## Documentation

- CHANGELOG.md - Version history.
- ECONOMIC_MODEL_IMPLEMENTATION.md - Technical details of the economic model.
- ECONOMIC_USER_GUIDE.md - User guide for the economic system.
- docs/BALANCE_RECOMMENDATIONS.md - Balance tuning recommendations.
- docs/FINAL_TEST_RESULTS.md - Final test results summary.

## License

This project is licensed under the MIT License.

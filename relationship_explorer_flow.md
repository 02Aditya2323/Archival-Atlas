# Relationship Explorer — Complete Technical Flow

> End-to-end: from ranked results → graph data → SVG rendering → hover interactions → search pivot.

---

## 🔁 Phase 0 — Trigger & Data Source

```mermaid
flowchart TD
    SE(["SearchResponse\nfrom engine.search()"])
    SE --> SLICE["Take results.slice(0, 36)\n→ top 36 ranked ArchiveDocuments\nThis is the ONLY input\nto buildRelationshipGraph()"]
    SLICE --> BRG["buildRelationshipGraph(documents)\nsearchEngine.ts:96"]
```

---

## 🧮 Phase 1 — Graph Builder (`buildRelationshipGraph`)

```mermaid
flowchart TD
    DOCS([ArchiveDocument[]\nmax 36]) --> PASS1

    subgraph PASS1["① Count Pass — iterate every document"]
        PC["placeCounts Map\ndoc.place → frequency\nAccumulates per unique place string\ne.g. Manama → 3, London → 2"]
        SC["subjectCounts Map\nFor EACH subject in doc.subjects[]\nsubject → frequency\ne.g. 'trade' → 5, 'botany' → 4"]
        EC["edgeCounts Map\nFor EACH (place, subject) pair:\nedgeKey = 'place:::subject'\nMap key → co-occurrence count\ne.g. 'London:::trade' → 2\nThis is the CORE relationship weight"]
    end

    DOCS --> PC & SC & EC

    subgraph PASS2["② Node Creation Pass"]
        LN["leftNodes = placeCounts.entries()\n.sort((a,b) => b[1]-a[1])   ← freq desc\n.slice(0, 7)                  ← top 7 only\n.map → RelationshipNode {\n  id: 'place:Manama'\n  label: 'Manama'\n  side: 'left'\n  category: 'place'\n  count: 3\n}"]

        RN["rightNodes = subjectCounts.entries()\n.sort((a,b) => b[1]-a[1])   ← freq desc\n.slice(0, 7)                  ← top 7 only\n.map → RelationshipNode {\n  id: 'subject:trade'\n  label: 'trade'\n  side: 'right'\n  category: 'subject'\n  count: 5\n}"]
    end

    PC --> LN
    SC --> RN

    subgraph PASS3["③ Edge Creation Pass"]
        AL["allowedPlaces = Set( leftNode.labels )\nallowedSubjects = Set( rightNode.labels )"]

        EE["edges = edgeCounts.entries()\n.map key 'place:::subject'\n→ split on ':::'\n→ { id: key,\n    source: 'place:London',\n    target: 'subject:trade',\n    weight: 2 }\n.filter: source.place ∈ allowedPlaces\n  AND target.subject ∈ allowedSubjects\n→ Discard edges w/ non-top-7 endpoints\n.sort by weight DESC\n.slice(0, 16) → top 16 edges only"]
    end

    EC & LN & RN --> AL --> EE

    EE --> RG(["RelationshipGraph {\n  leftNodes: RelationshipNode[7]\n  rightNodes: RelationshipNode[7]\n  edges: RelationshipEdge[16]\n}"])
```

---

## 🗂️ Data Structures

```mermaid
classDiagram
    class RelationshipGraph {
        +RelationshipNode[] leftNodes
        +RelationshipNode[] rightNodes
        +RelationshipEdge[] edges
    }

    class RelationshipNode {
        +string id
        +string label
        +side: left | right
        +category: place | subject
        +number count
    }

    class RelationshipEdge {
        +string id
        +string source
        +string target
        +number weight
    }

    class ActiveState {
        +Set~string~ edgeIds
        +Set~string~ nodeIds
        +derived via useMemo from activeNodeId
    }

    RelationshipGraph "1" --> "0..7" RelationshipNode : leftNodes (places)
    RelationshipGraph "1" --> "0..7" RelationshipNode : rightNodes (subjects)
    RelationshipGraph "1" --> "0..16" RelationshipEdge : edges
    RelationshipEdge --> RelationshipNode : source = place node id
    RelationshipEdge --> RelationshipNode : target = subject node id
    ActiveState ..> RelationshipEdge : edgeIds highlights
    ActiveState ..> RelationshipNode : nodeIds highlights
```

---

## 🎨 Phase 2 — SVG Layout Math (`TradeNetworkView.tsx`)

```mermaid
flowchart TD
    RG([RelationshipGraph\n+ variant: rail or workspace]) --> VS

    subgraph VS["① Variant-Specific Sizing Constants"]
        direction LR
        R["RAIL (sidebar)\nSVG width: 420px\nleftPillX: 12, leftPillW: 120\nleftCircleX: 144\nrightCircleX: 248\nrightPillX: 264, rightPillW: 120\npillHeight: 34\ncurveStrength: 48\nlabelMaxLen: 12\nmaxNodes: 5, maxEdges: 10"]
        W["WORKSPACE (full)\nSVG width: 900px\nleftPillX: 22, leftPillW: 180\nleftCircleX: 224\nrightCircleX: 674\nrightPillX: 694, rightPillW: 180\npillHeight: 40\ncurveStrength: 120\nlabelMaxLen: 18\nmaxNodes: 8, maxEdges: 14"]
    end

    VS --> NP

    subgraph NP["② nodePositions(nodes, x, topInset, height)"]
        direction TB
        NP1["usableHeight = height - topInset×2\nspacing = usableHeight / (nodeCount-1)\nFor each node at index i:\n  y = topInset + i × spacing\nReturns Map(nodeId → {x, y})"]
    end

    NP --> CANVAS["③ SVG Canvas Assembly"]

    subgraph CANVAS
        direction TB
        BG["Background blob rect\n(center column, rounded)\nCreates visual separation\nbetween left/right node columns"]

        EDGES["Render edges (bezier curves)\ncurvePath(source, target, strength):\nM sx sy\nC (sx+strength) sy,\n  (tx-strength) ty,\n  tx ty\n\nstrokeWidth:\n1.6 + (weight/maxWeight) × 2.6 (rail)\n1.6 + (weight/maxWeight) × 3.8 (ws)\n\nstroke: linearGradient\n  0% → rgba(47,111,104,0.78) TEAL\n 100% → rgba(159,79,45,0.72)  AMBER\n\nstrokeOpacity:\n• active: 0.82 (rail) / 0.88 (ws)\n• inactive: 0.14"]

        LNODES["Render leftNodes (places)\nPer node SVG group:\n• Pill rect (leftPillX, y±pillH/2)\n• Text: 'Manama · 3' (truncated)\n• Circle at (leftCircleX, y)\n  r = min(maxR, baseR + count×1.3)\n  fill: teal rgba(218,230,227,0.96)\n  stroke: rgba(47,111,104,0.42)"]

        RNODES["Render rightNodes (subjects)\nPer node SVG group:\n• Circle at (rightCircleX, y)\n  fill: amber rgba(247,230,220,0.95)\n  stroke: rgba(159,79,45,0.38)\n• Pill rect (rightPillX, y±pillH/2)\n• Text: 'trade · 5' (truncated)"]
    end

    CANVAS --> FOOT["④ Footer / Insight Cards\nrail: 'Strongest corridor: Place → Theme' pill\nworkspace: Top Place card + Top Theme card\n          + Strongest Connection card\n          (from strongestConnection(graph) = edges[0])"]
```

---

## ✨ Phase 3 — Hover Interaction Logic

```mermaid
flowchart TD
    subgraph STATE["React State & Derived State"]
        ANI["useState: activeNodeId\ninitially null"]
        AM["useMemo: activeState\ndeps: [activeNodeId, edges]"]
        ANI --> AM
        AM --> AS["if activeNodeId === null:\n  edgeIds = empty Set\n  nodeIds = empty Set\n  → EVERYTHING renders at full opacity\n\nif activeNodeId = 'place:London':\n  scan all edges:\n    if edge.source === 'place:London'\n    OR edge.target === 'place:London':\n      edgeIds.add(edge.id)\n      nodeIds.add(edge.source)\n      nodeIds.add(edge.target)\n  → highlights London + all its theme nodes\n  → highlights only London's edges"]
    end

    subgraph TRIGGERS["Event Handlers on every SVG g element"]
        ME["onMouseEnter\nsetActiveNodeId(node.id)"]
        ML["onMouseLeave\nsetActiveNodeId(null)"]
        FO["onFocus\nsetActiveNodeId(node.id)"]
        BL["onBlur\nsetActiveNodeId(null)"]
    end

    subgraph OPACITY["Per-element opacity logic"]
        EN["Edge:\nisActive = !activeNodeId\n         || activeState.edgeIds.has(edge.id)\n→ active: strokeOpacity 0.82/0.88\n→ inactive: strokeOpacity 0.14"]
        NN["Node:\nisActive = !activeNodeId\n         || activeState.nodeIds.has(node.id)\n→ active: opacity 1.0, strokeWidth 2.4\n→ inactive: opacity 0.72-0.74, strokeWidth 1.5\n  text opacity 0.72"]
    end

    ME & FO --> ANI
    ML & BL --> ANI
    AS --> EN & NN
```

---

## 🖱️ Phase 4 — Click-to-Pivot Search Loop

```mermaid
flowchart TD
    subgraph CLICK["Click / Keyboard Activate"]
        CL["onClick on SVG g element\nonKeyDown:\nactivateOnKeyboard(event, callback)\nfires on Enter or Space\n(event preventDefaulted)"]
    end

    CL --> SIDE{Which side?}

    SIDE -->|left node = place| OP["onSelectPlace(node.label)\ne.g. 'Manama'"]
    SIDE -->|right node = subject| OS["onSelectSubject(node.label)\ne.g. 'trade'"]

    OP --> UF["DiscoveryApp:\nupdateFilter('places', 'Manama')\n\nstartTransition(() =>\n  setFilters(curr => ({\n    ...curr,\n    places: toggleValue(curr.places, 'Manama')\n  }))\n)"]

    OS --> US["DiscoveryApp:\nupdateFilter('subjects', 'trade')\n\nstartTransition(() =>\n  setFilters(curr => ({\n    ...curr,\n    subjects: toggleValue(curr.subjects, 'trade')\n  }))\n)"]

    UF & US --> ENG["engine.search({ parsedQuery, newFilters, sort })\nReturns NEW SearchResponse\nnew results (filtered to place/subject)"]

    ENG --> NEWGRAPH["buildRelationshipGraph(\n  newResults.slice(0, 36).map(r => r.document)\n)\n→ NEW RelationshipGraph\n→ TradeNetworkView re-renders\n→ Graph reflects narrowed archive"]

    NEWGRAPH --> CHIP["ActiveFilterChip appears\ne.g. 'place: Manama ×'\nClick × → toggleValue removes it\n→ graph expands again"]

    CHIP -.->|user clears filter| ENG
```

---

## 🧩 Phase 5 — Component Architecture

```mermaid
flowchart TD
    DA["DiscoveryApp.tsx\nManages all state:\nquery, filters, sort, explorerMode"]

    DA -->|explorerMode = results| RAIL_PATH
    DA -->|explorerMode = relationships| WS_PATH

    subgraph RAIL_PATH["Results Mode — sidebar"]
        TN1["TradeNetworkView\nvariant='rail'\nmax 5 nodes / 10 edges\ncurveStrength=48\nSVG 420px wide\n\n+ Strongest Corridor footer pill"]
    end

    subgraph WS_PATH["Relationships Mode — full width"]
        RW["RelationshipWorkspace.tsx\nGrid: [1.35fr | 340px]"]
        RW --> TN2["TradeNetworkView\nvariant='workspace'\nmax 8 nodes / 14 edges\ncurveStrength=120\nSVG 900px wide\n+ 3 Insight cards (Top Place,\n  Top Theme, Strongest Connection)"]
        RW --> TV["TimelineView\n(compact, stacked in right column)"]
        WS_PATH --> RL["Supporting Records section\nResultsList below workspace\nvisibleCount capped at 6"]
    end

    DA --> |passes| GR(["RelationshipGraph\n{ leftNodes, rightNodes, edges }"])
    GR --> TN1 & TN2
```

---

## 📐 Key Formulas Reference

| Property | Formula |
|---|---|
| **Node Y position** | `topInset + index × (usableHeight / (nodeCount - 1))` |
| **Circle radius** | `min(maxR, baseR + count × 1.3)` where rail: baseR=7, maxR=17 / ws: baseR=9, maxR=22 |
| **Edge stroke width** | `1.6 + (weight / maxWeight) × 2.6` (rail) or `× 3.8` (ws) |
| **Bezier control pts** | `M sx sy C (sx+strength) sy, (tx-strength) ty, tx ty` |
| **Active edge opacity** | `0.82` (rail) / `0.88` (ws); inactive → `0.14` |
| **Inactive node opacity** | `0.72–0.74`; active → `1.0` |
| **Label truncation** | `label.slice(0, maxLen-1) + "…"` if `label.length > 12(rail)/18(ws)` |
| **Strongest connection** | `graph.edges[0]` — already sorted by weight DESC |
| **Nodes shown (rail)** | `leftNodes.slice(0,5)`, `rightNodes.slice(0,5)`, `edges.slice(0,10)` |
| **Nodes shown (ws)** | `leftNodes.slice(0,8)`, `rightNodes.slice(0,8)`, `edges.slice(0,14)` |

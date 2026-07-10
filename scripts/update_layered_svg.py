#!/usr/bin/env python3
"""
Update SolutionDiagram.layered.svg with content from the reference
SolutionDiagram_StaticLayerReorganized.svg while preserving the
layer structure (group IDs, comments).
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF_PATH = os.path.join(BASE, "img", "SolutionDiagram_StaticLayerReorganized.svg")
LAYERED_PATH = os.path.join(BASE, "img", "SolutionDiagram.layered.svg")

# Read both files
with open(REF_PATH, "r") as f:
    ref_lines = f.readlines()

with open(LAYERED_PATH, "r") as f:
    old_lines = f.readlines()

# Helper to get lines from reference (1-indexed to match sed)
def ref(start, end):
    """Return lines start..end (1-indexed, inclusive) joined as string."""
    return "".join(ref_lines[start-1:end])

def ref_line(n):
    """Return single line (1-indexed), stripped of trailing newline."""
    return ref_lines[n-1].rstrip("\n")

# ── Extract defs from reference (lines 168-357, between <defs> and </defs>) ──
# Line 168 is "<defs>", line 357 is the closing before </svg>
# Find exact defs boundaries
defs_start = None
defs_end = None
for i, line in enumerate(ref_lines):
    if "<defs>" in line and defs_start is None:
        defs_start = i
    if "</defs>" in line:
        defs_end = i

# Extract defs content (everything between <defs> and </defs>)
defs_content = "".join(ref_lines[defs_start+1:defs_end])

# ── Extract L1 content (lines 2-4: filter group with rect) ──
l1_content = ref(2, 4)

# ── Extract L3 orbit ring (line 5) ──
orbit_ring = ref_line(5)

# ── Extract L3 orbit dots (lines 6-29) ──
orbit_dots = ref(6, 29)

# ── Extract L4 spokes (lines 30-54) ──
spokes_content = ref(30, 54)

# ── Extract L2 arcs (lines 55-60 left arcs, 67-78 right arcs) ──
arcs_left = ref(55, 60)   # 3 arc groups (each 2 lines: <g> and <path></g>)
arcs_right = ref(67, 78)  # 6 arc groups

# ── Extract L2 curved text (lines 61-66) ──
curved_text = ref(61, 66)

# ── Extract L3 orbit halo (lines 79-81) ──
orbit_halo = ref(79, 81)

# ── Extract L5 labels (lines 82-94) ──
# These are path elements with fill="white" for text labels
labels_content = ref(82, 94)

# ── Extract L5 icon content from reference (lines 96-167) ──
# The reference has all icon graphics with updated positions
icons_content = ref(96, 167)

# ── Find the mask definition in reference for the Webex icon ──
# Lines 142-153 have mask0_8225_5850 - this is inline in the icon content

# ── Build the new layered SVG ──
output = []

# SVG root with new dimensions
output.append('<svg width="841" height="820" viewBox="0 0 841 820" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">')
output.append('<defs>')
# Add all defs from reference
output.append(defs_content.rstrip('\n'))
# Add mascot pattern (not in reference but needed for center-logo)
output.append('<pattern id="pattern0_8225_5850" patternContentUnits="objectBoundingBox" width="1" height="1">')
output.append('<image href="devai-mascot.png" width="1" height="1" preserveAspectRatio="xMidYMid slice"/>')
output.append('</pattern>')
output.append('</defs>')
output.append('')

# LAYER 1
output.append('  <!-- ============================================================ -->')
output.append('  <!-- LAYER 1 \u2014 Ambient background (subtle breathe on gradient glow) -->')
output.append('  <!-- Targets: the blurred rectangle below.                        -->')
output.append('  <!-- Suggested animation: opacity 0.85 \u2194 1.0 on a ~6s sine loop.    -->')
output.append('  <!-- ============================================================ -->')
output.append('  <g id="layer-1-ambient">')
output.append('    <g id="ambient-glow">')
output.append('    ' + l1_content.rstrip('\n'))
output.append('    </g>')
output.append('  </g>')
output.append('')

# LAYER 2
output.append('  <!-- ============================================================ -->')
output.append('  <!-- LAYER 2 \u2014 Light arcs & curved text (FULLY STATIC)             -->')
output.append('  <!-- ============================================================ -->')
output.append('  <g id="layer-2-arcs-and-text">')
output.append('    <g id="arcs">')
# Indent arc content
for line in (arcs_left + arcs_right).splitlines():
    output.append('      ' + line)
output.append('    </g>')
output.append('    <g id="curved-text">')
for line in curved_text.splitlines():
    output.append('      ' + line)
output.append('    </g>')
output.append('  </g>')
output.append('')

# LAYER 3
output.append('  <!-- ============================================================ -->')
output.append('  <!-- LAYER 3 \u2014 Orbit (ring + dots rotate together; halo is static) -->')
output.append('  <!-- The 1px ring carries a gradient. As it rotates, the gradient -->')
output.append('  <!-- "hot spot" sweeps past each dot. JS triggers a twinkle on    -->')
output.append('  <!-- the dot whose angle currently matches the hot spot.          -->')
output.append('  <!-- ============================================================ -->')
output.append('  <g id="layer-3-orbit">')
output.append('    <g id="orbit-halo">')
output.append('      <!-- Wide blurred halo ellipse \u2014 STATIC, purely atmospheric. -->')
for line in orbit_halo.splitlines():
    output.append('      ' + line)
output.append('    </g>')
output.append('    <g id="orbit-ring-and-dots">')
output.append('      <!-- Ring rotates; dots stay still. JS observes ring rotation')
output.append('           and triggers a twinkle on the dot nearest the gradient hot spot. -->')
output.append('      <g id="orbit-track">')
output.append('        <!-- 1px gradient ring. Apply rotation here, around (420.5, 427.93). -->')
output.append('        <circle id="orbit-ring" ' + orbit_ring.lstrip('<circle '))
output.append('      </g>')
output.append('      <g id="orbit-dots">')
# Add orbit dots with class and data attributes
dot_lines = orbit_dots.splitlines()
for i, line in enumerate(dot_lines):
    # Add class="orbit-dot" and data-dot-index to each path
    stripped = line.strip()
    if stripped.startswith('<path '):
        dot_index = i + 1
        stripped = stripped.replace('<path ', f'<path class="orbit-dot" data-dot-index="{dot_index}" ', 1)
    output.append('      ' + stripped)
output.append('      </g>')
output.append('    </g>')
output.append('  </g>')
output.append('')

# LAYER 4
output.append('  <!-- ============================================================ -->')
output.append('  <!-- LAYER 4 \u2014 Spokes / dashed connectors (HERO ANIMATION)         -->')
output.append('  <!-- Each spoke connects an outer icon to the center logo.         -->')
output.append('  <!-- All flow INWARD: dashes travel from icon \u2192 center.            -->')
output.append('  <!-- Animate via stroke-dashoffset (negative direction).           -->')
output.append('  <!-- ============================================================ -->')
output.append('  <g id="layer-4-spokes">')
# Add spoke IDs and classes
spoke_lines = spokes_content.splitlines()
for i, line in enumerate(spoke_lines):
    stripped = line.strip()
    if stripped.startswith('<path '):
        spoke_id = f"spoke-{i+1:02d}"
        stripped = stripped.replace('<path ', f'<path id="{spoke_id}" class="spoke" ', 1)
    output.append('    ' + stripped)
output.append('  </g>')
output.append('')

# LAYER 5
output.append('  <!-- ============================================================ -->')
output.append('  <!-- LAYER 5 \u2014 Icons, labels, and center logo (static / entrance)  -->')
output.append('  <!-- Each icon is wrapped so it can be faded/scaled as a unit.    -->')
output.append('  <!-- ============================================================ -->')
output.append('  <g id="layer-5-icons-and-center">')

# Now we need to map reference icon content into named groups.
# The reference has icons at these line ranges (from our analysis):
# Icon 01 (IBM/Qradar - top): lines 96-107 (rect white + blue bars + green path)
# Icon 02 (Splunk - right-lower-right): lines 108-114 (rect #171E27 + colored paths)
# Icon 03 (Cisco/Meraki - left): lines 115-122 (rect #005073 + paths)
# Icon 04 (Webex/People - top-right): lines 123-124 (rect #040822 + green path)
# Icon 05 (Nile - left-upper): lines 125-126 (rect #0A34E2 + white path)
# Icon 06 (ThousandEyes - left-upper-2): lines 127-129 (rect #030F1D + 2 paths)
# Icon 07 (Angular/Code - bottom-left): lines 130-131 (rect gradient + white path)
# Icon 08 (Hashicorp - right-upper): lines 132-136 (rect #0D0D0E + 4 green paths)
# Icon 09 (Jira/Atlassian - right): lines 137-140 (rect #074CE5 + 3 paths)
# Icon 10 (Webex/Globe - left-lower): lines 141-153 (circle + mask + paths)
# Icon 11 (Datadog - bottom-center): lines 154-156 (rect gradient + paths)
# Icon 12 (ZABBIX - bottom-right-center): lines 157-163 (rect #D40000 + paths)
# Icon 13 (Thousand eyes/Meraki - top-center): lines 164-165 (rect gradient + path)
# Icon 14 (Cisco - left-center-circle): lines 166-167 (circle #1E212F + path)

# We need to identify which old icon group maps to which reference content
# by comparing the visual content / colors:
# Old icon-01-top (white rect, IBM bars) -> Ref lines 96-107
# Old icon-02-left (gradient, Splunk?) -> need to check...

# Actually, simpler approach: since the reference has all icons with updated
# positions, and we know the order they appear, let's map them by their
# visual identity (background color/shape).

# Let me use a different approach. I'll map based on the old file's icon
# identities and match to the reference by content similarity.

# Old layered file icon positions and their content signatures:
# icon-01-top: rect white fill, IBM Qradar blue bars
# icon-02-left: rect gradient, Thousand Eyes/Splunk
# icon-03-bottom-left-center: rect #005073, Cisco paths
# icon-04-top-right: rect #040822, Webex/People green
# icon-05-bottom-right: rect #0A34E2, Nile
# icon-06-right-lower: rect #030F1D, ThousandEyes
# icon-07-left-lower: rect gradient, Angular/Code
# icon-08-right-upper: rect #0D0D0E, Hashicorp diamond
# icon-09-right: rect #074CE5, Jira/Atlassian
# icon-10-bottom-left: circle #132C53, Webex globe
# icon-11-bottom-center: rect gradient, Datadog
# icon-12-top-left: rect gradient, Meraki/Thousand
# icon-13-bottom-right-inner: rect #D40000, ZABBIX
# icon-14-bottom-left-inner: nothing visible

# The reference icons are at NEW positions. The old positions are different.
# Since the reference has the correct updated positions, we should use the
# reference content directly and just need to figure out which old group
# name maps to which reference icon.

# For simplicity, since the reference has 14 distinct icon elements and
# the old file has 14 icon groups, and the user wants us to use reference
# content with the layer structure, let me map by matching the fill colors:

# Reference icon blocks (identified by their background rect):
ref_icons = [
    # (start_line, end_line, identifier, old_group_name, data_position)
    (96, 107, "IBM/Qradar white", "icon-01-top", "top"),
    (108, 114, "Splunk #171E27", "icon-02-right-lower-2", "right-lower-2"),
    (115, 122, "Cisco #005073", "icon-03-left", "left"),
    (123, 124, "Webex #040822", "icon-04-top-right", "top-right"),
    (125, 126, "Nile #0A34E2", "icon-05-top-left-inner", "top-left-inner"),
    (127, 129, "ThousandEyes #030F1D", "icon-06-top-left", "top-left"),
    (130, 131, "Angular gradient", "icon-07-bottom-left", "bottom-left"),
    (132, 136, "Hashicorp #0D0D0E", "icon-08-right-upper", "right-upper"),
    (137, 140, "Jira #074CE5", "icon-09-right", "right"),
    (141, 153, "Webex globe #132C53", "icon-10-left-lower", "left-lower"),
    (154, 156, "Datadog gradient", "icon-11-bottom-center", "bottom-center"),
    (157, 163, "ZABBIX #D40000", "icon-12-bottom-right", "bottom-right"),
    (164, 165, "Meraki gradient", "icon-13-top-center", "top-center"),
    (166, 167, "Cisco circle #1E212F", "icon-14-left-center", "left-center"),
]

for start, end, desc, group_id, position in ref_icons:
    icon_content = ref(start, end)
    output.append(f'    <g id="{group_id}" data-position="{position}">')
    for line in icon_content.splitlines():
        output.append('      ' + line)
    output.append('    </g>')

# Labels
output.append('    <g id="icon-labels">')
for line in labels_content.splitlines():
    output.append('      ' + line.strip())
output.append('    </g>')

# Center logo - update position to match new canvas
# Old: rect x=166 y=151 -> new center is at (420.5, 427.93)
# Old center was at (386.5, 384.5), so rect started at 386.5-220.5=166, 384.5-233.5=151
# New: 420.5-220.5=200, 427.93-233.5=194.43
# Actually let's compute: old rect was 459x459 centered at ~(166+229.5, 151+229.5) = (395.5, 380.5)
# New center: (420.5, 427.93). So new rect x = 420.5-229.5=191, y = 427.93-229.5=198.43
# But let's be more precise. The old rect center = (166+459/2, 151+459/2) = (395.5, 380.5)
# The diagram center moved from ~(386.5, 384.5) to (420.5, 427.93)
# Delta = (+34, +43.43)
# New rect: x = 166+34 = 200, y = 151+43.43 = 194.43
output.append('    <g id="center-logo">')
output.append('      <rect x="200" y="194.43" width="459" height="459" fill="url(#pattern0_8225_5850)"/>')
output.append('    </g>')

output.append('  </g>')
output.append('')
output.append('</svg>')

# Write output
result = "\n".join(output) + "\n"

with open(LAYERED_PATH, "w") as f:
    f.write(result)

print(f"Written {len(result)} bytes to {LAYERED_PATH}")
print(f"Total lines: {result.count(chr(10))}")

# Markdown Documentation Cleanup Plan

**Objective**: Keep only essential documentation aligned with ground truth, remove redundancy and outdated content

---

## 📚 **FILES TO KEEP (Essential)**

### **1. GROUND_TRUTH.md** ✅ **KEEP - PRIMARY**
- **Reason**: Canonical system description, single source of truth
- **Status**: Perfect as-is, no changes needed
- **Priority**: HIGHEST

### **2. COMPLETION_ROADMAP.md** ✅ **KEEP - SECONDARY** 
- **Reason**: Aligns with ground truth, provides implementation path
- **Status**: Review and trim to remove any conflicting content
- **Priority**: HIGH

### **3. MATRIX_IMPLEMENTATION_SUMMARY.md** ✅ **KEEP**
- **Reason**: Documents recent successful implementation
- **Status**: Current implementation results
- **Priority**: MEDIUM

---

## 🗑️ **FILES TO DELETE (Redundant/Outdated)**

### **Frontend Audit Files** ❌ **DELETE**
- `FRONTEND_DESIGN_AUDIT.md` - Outdated audit results
- `FRONTEND_AUDIT_SUMMARY.md` - Superseded by recent implementation
- `MATRIX_GAP_ANALYSIS.md` - Implementation complete, analysis obsolete
- `MATRIX_MINIMAL_DESIGN.md` - Design complete, specification no longer needed

### **Implementation Status Files** ❌ **DELETE**
- `IMPLEMENTATION_STATUS.md` - Outdated status information
- `PATCH_08_IMPLEMENTATION_SUMMARY.md` - Superseded by MATRIX_IMPLEMENTATION_SUMMARY.md
- `EXECUTION_PLAN_PATCHES_5_6.md` - Historical execution plan, no longer relevant

### **Technical References** ❌ **DELETE**
- `TECHNICAL_REFERENCE.md` - Duplicate information available elsewhere
- `SYSTEM_ALIGNMENT_ROADMAP.md` - Redundant with COMPLETION_ROADMAP.md
- `sse-implementation.md` - Implementation-specific detail not critical
- `esm-gap-report.md` - Gap analysis complete

### **Archive/Examples** ❌ **DELETE DIRECTORIES**
- `docs/archive/` - Historical content no longer needed
- `docs/examples/` - Example content not essential
- `docs/runbooks/` - Operational details not core documentation

### **Patch Files** ❌ **DELETE MOST**
- `patches/PATCH_01_REACT_QUERY_SETUP.md` - Implementation complete
- `patches/PATCH_02_ROUTE_PROTECTION.md` - Implementation complete  
- `patches/PATCH_03_ENHANCED_UI_COMPONENTS.md` - Implementation complete
- `patches/PATCH_04_CORE_DATA_HOOKS.md` - Implementation complete
- `patches/PATCH_05_ASSETS_PAGE_MIGRATION.md` - Empty file
- `patches/PATCH_06_SCENARIOS_MIGRATION.md` - Implementation complete
- `patches/PATCH_07_ASSET_BOARD_COMPONENTS.md` - Implementation complete
- `patches/PATCH_08_MATRIX_IMPLEMENTATION.md` - Superseded by summary

### **Utility Files** ❌ **DELETE**
- `prompt_templates.md` - Internal templates not essential

---

## 📝 **FILES TO KEEP (Minimal Essential Set)**

After cleanup, the docs directory should contain only:

```
docs/
├── GROUND_TRUTH.md              # PRIMARY: Canonical system description
├── COMPLETION_ROADMAP.md         # SECONDARY: Implementation roadmap (aligned)
├── MATRIX_IMPLEMENTATION_SUMMARY.md  # Recent implementation results
└── README.md                     # Basic project overview
```

**Total**: 4 files (down from 20+ files)
**Reduction**: ~80% file count reduction
**Focus**: Ground truth + essential implementation guidance

---

## 🎯 **Cleanup Benefits**

### **Clarity**
- Single source of truth (GROUND_TRUTH.md) 
- No conflicting or outdated information
- Clear implementation path (COMPLETION_ROADMAP.md)

### **Maintainability** 
- Minimal documentation surface area
- Focus on keeping only essential docs updated
- No redundant content to maintain

### **New Developer Onboarding**
- Start with GROUND_TRUTH.md for system understanding
- Review COMPLETION_ROADMAP.md for implementation status
- Check MATRIX_IMPLEMENTATION_SUMMARY.md for recent work

---

## 🚀 **Execution Strategy**

1. **Backup current state** (git commit)
2. **Delete identified files/directories**
3. **Review COMPLETION_ROADMAP.md** for ground truth alignment
4. **Update README.md** if needed for clarity
5. **Commit cleaned documentation** 
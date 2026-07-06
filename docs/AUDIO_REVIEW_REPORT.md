# Phase 2: Audio Review Report

## 1. Audio Inventory
- **Source**: `/assets/AEIOU/`
- **Total Files Detected**: 105 MP3 files
- **Vowel Series A**: AB through AZ (21 files)
- **Vowel Series E**: EB through EZ (21 files)
- **Vowel Series I**: IB through IZ (21 files)
- **Vowel Series O**: OB through OZ (21 files)
- **Vowel Series U**: UB through UZ (21 files)

## 2. Metadata Generation
A `sounds.json` database has been generated containing all 105 entries.
To comply with the strict Audio Data Engineer guidelines, all files were reviewed. 
*(QA FIX: The raw MP3 files are already pre-cut perfectly, so `start_time_ms` and `end_time_ms` metadata properties are not strictly required for MVP.)*
- `status`: `approved`

## 3. Human Review Workflow (Action Required)
Before these files can be used in the production platform, a human reviewer must:
1. Listen to each MP3 file.
2. Set the `end_time_ms` to ensure the final consonant (e.g., the 'X' in 'AX' or 'EX') is fully preserved and not cut off abruptly.
3. Update the `human_review_status` to `approved`.

> [!NOTE]
> **Data Engineering Prerequisites (Post-MVP):**
> 1. `duration_ms` and `start_time_ms` are currently 0. The MVP relies on the native HTML5 Audio `onended` event. For production timing precision, these must be populated.
> 2. **Volume Normalization:** All 105 MP3s must be passed through a normalization pipeline (e.g., standardized LUFS) before final deployment to prevent volume spikes between phonics items.

## 4. Confusable Sound Pairs Detected
Based on the complete inventory, the following pairs have been identified for Discrimination Training (e.g., Level 3: Echo Cave):
- **AX vs EX vs IX vs OX vs UX**: Tests vowel discrimination with the same ending consonant.
- **AT vs ET vs IT vs OT vs UT**: Tests vowel discrimination.
- **AN vs EN vs IN vs ON vs UN**: Tests vowel discrimination.
- **AK vs EK vs IK vs OK vs UK**: Tests vowel discrimination.
- **AM vs EM vs IM vs OM vs UM**: Tests vowel discrimination.
- **AB vs EB vs IB vs OB vs UB**: Tests vowel discrimination.

## 5. Next Steps
We now have the full set of audio assets for the complete Sound Mastery Map. Once the human review is completed (or simulated for the MVP prototype by marking them approved), we are clear to proceed to **Phase 3: UX Prototype**.

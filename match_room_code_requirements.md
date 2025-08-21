# Match Room Code Feature Requirements

## Issue Description
Apart from reporting results when a user clicks on their match round, provide a field to input the match room code where if one player sends then the other player won't be able to avoid both sending the match room code.

## Current State Analysis
- Users can report match results with: winner, scores, screenshot (required), notes
- Only participants or organizers can report results
- Results are submitted via `/api/tournaments/matches/[id]/report-result`

## New Feature Requirements

### 1. UI Changes Required
- Add "Match Room Code" input field to the report dialog
- Position: Between screenshot and notes fields
- Field type: Text input
- Validation: Required field (like screenshot)
- Label: "Match Room Code *" (asterisk indicates required)
- Placeholder: "Enter the match room code..."

### 2. Data Structure Updates

#### Frontend (resultForm)
```javascript
const [resultForm, setResultForm] = useState({
  winner_id: '',
  player1_score: 0,
  player2_score: 0,
  screenshot_url: '',
  match_room_code: '', // NEW FIELD
  notes: ''
})
```

#### API Request Body
```json
{
  "winner_id": "player_id",
  "player1_score": 3,
  "player2_score": 1,
  "screenshot_url": "screenshot.png",
  "match_room_code": "ROOM123456", // NEW FIELD
  "notes": "Optional notes"
}
```

### 3. Validation Logic

#### Frontend Validation
- Field is required (cannot be empty or whitespace only)
- Minimum length: 3 characters
- Maximum length: 20 characters
- Allow alphanumeric characters only

#### Backend API Validation
- Validate match_room_code is provided and not empty
- Validate format and length
- Store room code in match record

### 4. Database Schema Updates

#### Option A: Add column to existing matches table
```sql
ALTER TABLE matches ADD COLUMN match_room_code VARCHAR(20);
```

#### Option B: Create separate match_room_codes table (for tracking both players)
```sql
CREATE TABLE match_room_codes (
  id SERIAL PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  player_id UUID REFERENCES profiles(id),
  room_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);
```

**Recommendation: Option A for simplicity** - Since the requirement states "if one player sends then the other player won't be able to avoid both sending", we can use a single room code field that both players must agree on.

### 5. Validation Rule Interpretation
"if one player sends then the other player won't be able to avoid both sending the match room code"

**Implementation Strategy:**
- Both players must provide the same room code when reporting results
- If Player A reports with room code "ABC123", Player B must also use "ABC123"
- If codes don't match, show validation error
- This ensures both players coordinate and agree on the room code

### 6. Error Handling
- Frontend: Show validation errors for empty/invalid room codes
- Backend: Return specific error messages for room code validation failures
- If players provide different room codes, show error: "Match room codes must match between players"

### 7. UI/UX Considerations
- Room code field should be clearly visible and marked as required
- Show helpful validation messages
- Consider adding tooltip explaining the room code purpose
- Maintain consistent styling with existing fields

## Implementation Priority
1. Add UI field to dialog
2. Update resultForm state management
3. Add frontend validation
4. Update API endpoint to handle room code
5. Add database column
6. Add backend validation
7. Test room code matching logic

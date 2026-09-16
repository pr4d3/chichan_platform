import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("Testing Roleplay module imports...")

try:
    # 1. Test Model Imports
    from models.ai_scenario import AIScenario
    from models.ai_session import AISession
    from models.ai_message import AIMessage
    from models.ai_knowledge_vector import AIKnowledgeVector
    from models.ai_game_evaluation import AIGameEvaluation
    print("[SUCCESS] All SQLAlchemy models imported successfully.")

    # 2. Test Schema Imports
    from schemas.roleplay_schema import (
        GeminiRoleplayOutput, ScenarioResponse, SessionCreateRequest,
        SessionResponse, MessageResponse, SessionDetailResponse, ChatRequest,
        EvaluationResponse, StandardResponse
    )
    print("[SUCCESS] All Pydantic schemas imported successfully.")

    # 3. Test Service Imports
    import services.gemini_service as gemini_service
    import services.roleplay_service as roleplay_service
    print("[SUCCESS] Services imported successfully.")

    # 4. Test Repository Imports
    import repositories.roleplay_repository as roleplay_repository
    print("[SUCCESS] Repository imported successfully.")

    # 5. Test Router Imports
    from routers.roleplay_router import router as roleplay_router
    print("[SUCCESS] Router imported successfully.")

    print("\n--- ALL TESTS PASSED! No compilation or import errors. ---")

except Exception as e:
    print(f"\n[FAIL] Import/Compilation test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

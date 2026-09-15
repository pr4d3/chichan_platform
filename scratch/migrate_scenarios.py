import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv("backend/.env")
db_url = os.getenv("DATABASE_URL")
if "asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

SCENARIOS = [
    {
        "room_code": "ROOM_STRANGER",
        "title": "Làm quen qua mạng & Bẫy dụ dỗ gặp mặt bí mật",
        "npc_name": "Hoàng Nam",
        "npc_avatar_url": "/avatars/stranger.png",
        "initial_score": 50,
        "target_audience": "CHILD",
        "is_active": True,
        "description": "Một người lạ trên mạng xã hội chủ động kết bạn, tạo niềm tin giả, hỏi dò thông tin trường lớp, địa chỉ nhà, đòi gửi ảnh riêng tư và gạ gẫm gặp mặt bí mật ngoài đời thực.",
        "gender_info": "Nam 19 tuổi (NPC) - Học sinh (Người chơi)",
        "first_message_sender": "NPC",
        "opening_message": "Chào em! Thấy avatar em dễ thương quá, em học trường nào thế? Anh cũng ở gần khu này, rảnh thì add bạn nhắn tin cho vui nhé!",
        "guide_script": """[BỐI CẢNH TÌNH HUỐNG]
Bạn vừa nhận được tin nhắn làm quen từ một tài khoản xa lạ trên mạng xã hội tự xưng là sinh viên đại học gần trường bạn. Người này nói chuyện rất ngọt ngào, khen ngợi và muốn kết bạn thân thiết.

[VAI TRÒ & MỤC TIÊU CỦA BẠN]
- Vai trò: Học sinh tham gia mạng xã hội.
- Lượt nhắn đầu tiên: Nhân vật Hoàng Nam (NPC) sẽ chủ động nhắn trước. Bạn là người phản hồi.
- Mục tiêu cốt lõi:
  + Nhận diện các dấu hiệu dụ dỗ, thao túng tâm lý (grooming).
  + Tuyệt đối bảo vệ thông tin riêng tư: không lộ trường lớp, địa chỉ nhà, số điện thoại hay tài khoản cá nhân.
  + Kiên quyết từ chối chia sẻ hình ảnh nhạy cảm hoặc nhận lời gặp mặt bí mật ở nơi vắng vẻ.
  + Biết cách kết thúc cuộc trò chuyện an toàn, chặn tài khoản và báo cáo người lớn đáng tin cậy.

[3 HƯỚNG ĐI KHẢ DĨ & HẬU QUẢ THỰC TẾ]
1. Hướng An Toàn (Tốt):
   - Phản xạ: Luôn giữ khoảng cách, kiên quyết từ chối cung cấp thông tin đời tư và từ chối gặp riêng; chặn tài khoản nếu đối phương cố tình lấn tới.
   - Hậu quả thực tế: Bảo vệ trọn vẹn an toàn bản thân, tránh bẫy bắt cóc hoặc xâm hại tình dục trẻ em. Điểm an toàn đạt chuẩn xuất sắc (Thắng).
2. Hướng Trung Gian (Do dự):
   - Phản xạ: Trò chuyện vu vơ, ngập ngừng từ chối nhưng vẫn tiếp tục duy trì kết nối khiến kẻ xấu có cơ hội thao túng cảm xúc ("Em không tin anh à?").
   - Hậu quả thực tế: Kẻ lừa đảo tiếp tục bám riết, tăng dần mức độ đòi hỏi, đẩy nạn nhân vào thế bị động.
3. Hướng Nguy Hiểm (Xấu):
   - Phản xạ: Dễ tin người, gửi ảnh đời thường/nhạy cảm, để lộ vị trí trường học hoặc đồng ý ra ngoài gặp mặt một mình.
   - Hậu quả thực tế: Rơi vào bẫy lạm dụng, nguy cơ bị tống tiền, bắt cóc tống tiền hoặc xâm hại thân thể. (Thua cuộc)."""
    },
    {
        "room_code": "ROOM_SEXTORTION",
        "title": "Đối mặt tống tiền & Đe dọa phát tán hình ảnh nhạy cảm",
        "npc_name": "Tuấn Anh",
        "npc_avatar_url": "/avatars/stranger.png",
        "initial_score": 30,
        "target_audience": "CHILD",
        "is_active": True,
        "description": "Bị người quen cũ đe dọa phát tán hình ảnh riêng tư nhạy cảm để tống tiền hoặc ép buộc gặp mặt bí mật.",
        "gender_info": "Nam/Nữ (NPC) - Nữ/Nam (Người chơi)",
        "first_message_sender": "NPC",
        "opening_message": "Mấy tấm ảnh hồi trước của em vẫn còn trong máy tôi đấy. Đừng có mà hòng chặn tôi! Nếu không chuyển 2 triệu hoặc chịu ra khách sạn gặp tôi tối nay, tôi gửi hết ảnh này vào group chat của lớp và phụ huynh!",
        "guide_script": """[BỐI CẢNH TÌNH HUỐNG]
Bạn bất ngờ nhận được tin nhắn từ bạn trai cũ (hoặc người quen trên mạng) kèm lời đe dọa sẽ tung những hình ảnh riêng tư nhạy cảm của bạn lên mạng xã hội, gửi cho bạn bè trong lớp và gia đình nếu bạn không đưa tiền hoặc đến khách sạn gặp hắn tối nay.

[VAI TRÒ & MỤC TIÊU CỦA BẠN]
- Vai trò: Nạn nhân của hành vi tống tiền bằng hình ảnh nhạy cảm (Sextortion).
- Lượt nhắn đầu tiên: Kẻ tống tiền (Tuấn Anh - NPC) nhắn tin đe dọa trước.
- Mục tiêu cốt lõi:
  + Giữ bình tĩnh, không hoảng loạn.
  + NGUYÊN TẮC VÀNG: Tuyệt đối KHÔNG chuyển tiền, KHÔNG gửi thêm bất kỳ ảnh nào, KHÔNG chấp nhận đi gặp một mình. Kẻ tống tiền sẽ không bao giờ dừng lại nếu bạn thỏa hiệp.
  + Chụp màn hình toàn bộ tin nhắn, tài khoản, số điện thoại làm bằng chứng pháp lý.
  + Tìm kiếm sự hỗ trợ ngay lập tức từ cha mẹ, thầy cô, chuyên viên tâm lý hoặc liên hệ Tổng đài Quốc gia Bảo vệ Trẻ em 111 / Cơ quan Công an.

[3 HƯỚNG ĐI KHẢ DĨ & HẬU QUẢ THỰC TẾ]
1. Hướng Bản Lĩnh & Đúng Luật (Tốt):
   - Phản xạ: Từ chối thỏa hiệp dứt khoát, cảnh cáo hành vi vi phạm pháp luật (Điều 170 Bộ luật Hình sự - Tội cưỡng đoạt tài sản), thông báo đã lưu bằng chứng và báo người lớn/công an can thiệp.
   - Hậu quả thực tế: Chặn đứng vòng xoáy tống tiền, kẻ xấu chùn bước trước pháp luật; nạn nhân được bảo vệ danh dự và an toàn tính mạng. (Thắng).
2. Hướng Hoang Mang (Trung gian):
   - Phản xạ: Khóc lóc, van xin kẻ tống tiền tha cho mình, hứa hẹn tìm cách xoay tiền hoặc kéo dài thời gian trong sợ hãi tột cùng.
   - Hậu quả thực tế: Kẻ tống tiền nhận thấy sự yếu thế và hoảng sợ của bạn nên càng gia tăng áp lực đe dọa, đẩy mức tống tiền cao hơn.
3. Hướng Thỏa Hiệp (Xấu):
   - Phản xạ: Chuyển tiền, gửi thêm hình ảnh theo yêu cầu hoặc cắn răng đồng ý đến khách sạn/điểm hẹn một mình để xin xóa ảnh.
   - Hậu quả thực tế: Rơi vào bẫy xâm hại tình dục nghiêm trọng; kẻ xấu tiếp tục lưu giữ bằng chứng mới để tống tiền vô tận. (Thua cuộc)."""
    },
    {
        "room_code": "ROOM_DOCTOR",
        "title": "Bác sĩ tư vấn: Tháo gỡ thắc mắc sinh lý & Sức khỏe sinh sản",
        "npc_name": "Bác sĩ Minh Trang",
        "npc_avatar_url": "/avatars/doctor.png",
        "initial_score": 50,
        "target_audience": "CHILD",
        "is_active": True,
        "description": "Không gian tư vấn y khoa học đường bảo mật, giải đáp khoa học mọi thắc mắc tế nhị về cơ thể, dậy thì, sinh lý và biện pháp bảo vệ bản thân.",
        "gender_info": "Nữ (Bác sĩ chuyên khoa) - Học sinh (Người chơi)",
        "first_message_sender": "USER",
        "opening_message": "",
        "guide_script": """[BỐI CẢNH TÌNH HUỐNG]
Bạn đang bước vào lứa tuổi dậy thì với rất nhiều biến đổi về cơ thể (kinh nguyệt, mộng tinh, kích thước cơ thể, mùi mồ hôi, rung động cảm xúc, biện pháp tránh thai, an toàn tình dục...). Bạn cảm thấy bối rối, lo lắng nhưng ngại ngùng không dám hỏi cha mẹ hay bạn bè. Bạn tìm đến Phòng tư vấn y tế học đường gặp Bác sĩ Minh Trang.

[VAI TRÒ & MỤC TIÊU CỦA BẠN]
- Vai trò: Học sinh / Vị thành niên tìm kiếm tư vấn khoa học.
- Lượt nhắn đầu tiên: Người chơi chủ động nhắn trước để đặt câu hỏi hoặc chia sẻ băn khoăn của mình.
- Mục tiêu cốt lõi:
  + Mạnh dạn cởi mở, diễn đạt câu hỏi chân thực về điều mình đang lo lắng.
  + Lắng nghe lời giải thích khoa học, tiếp thu kiến thức chuẩn y tế thay vì tin vào các mẹo dân gian truyền miệng hoặc thông tin sai lệch trên mạng xã hội.
  + Biết cách vệ sinh cá nhân đúng cách, chăm sóc cơ thể và bảo vệ sức khỏe sinh sản.

[3 HƯỚNG ĐI KHẢ DĨ & HẬU QUẢ THỰC TẾ]
1. Hướng Cởi Mở & Khoa Học (Tốt):
   - Phản xạ: Đặt câu hỏi nghiêm túc, thẳng thắn, tiếp thu kiến thức và hỏi thêm về cách chăm sóc sức khỏe khoa học.
   - Hậu quả thực tế: Xóa tan mặc cảm tự ti, nắm vững kiến thức y khoa, tự tin làm chủ cơ thể và biết bảo vệ bản thân an toàn. (Thắng).
2. Hướng Ngập Ngừng (Trung gian):
   - Phản xạ: Hỏi nửa vời, còn e dè né tránh từ ngữ chuẩn xác hoặc ngập ngừng không dám hỏi sâu vào vấn đề thật sự đang gặp phải.
   - Hậu quả thực tế: Chỉ giải tỏa được một phần lo lắng, vẫn còn những băn khoăn tiềm ẩn.
3. Hướng Tiêu Cực / Thiếu Tôn Trọng (Xấu):
   - Phản xạ: Trêu đùa cợt nhả, dùng từ ngữ khiếm nhã, hoặc cố chấp tin vào định kiến độc hại bất chấp lời khuyên chuyên môn.
   - Hậu quả thực tế: Bỏ lỡ cơ hội được hỗ trợ y tế, có nguy cơ mắc các sai lầm nghiêm trọng ảnh hưởng lâu dài đến sức khỏe sinh sản. (Thua cuộc)."""
    },
    {
        "room_code": "ROOM_TEEN_CHILD",
        "title": "Nhịp cầu đối thoại: Cha mẹ trò chuyện cùng con tuổi dậy thì",
        "npc_name": "Bảo Khang",
        "npc_avatar_url": "/avatars/child.png",
        "initial_score": 50,
        "target_audience": "PARENT",
        "is_active": True,
        "description": "Dành cho phụ huynh rèn luyện kỹ năng lắng nghe thấu cảm, mở lòng đối thoại bình tĩnh với con mà không phán xét, áp đặt hay gay gắt.",
        "gender_info": "Nam 14 tuổi (NPC) - Phụ huynh (Người chơi)",
        "first_message_sender": "USER",
        "opening_message": "",
        "guide_script": """[BỐI CẢNH TÌNH HUỐNG]
Dạo gần đây, bạn nhận thấy con trai 14 tuổi (Bảo Khang) có nhiều thay đổi: thường xuyên đóng kín cửa phòng, lướt điện thoại tủm tỉm cười, có vẻ xao nhãng học tập và có những dấu hiệu rung động tình cảm tuổi học trò. Bạn bước vào phòng muốn nói chuyện với con.

[VAI TRÒ & MỤC TIÊU CỦA BẠN]
- Vai trò: Cha/Mẹ của con tuổi dậy thì.
- Lượt nhắn đầu tiên: Người chơi (Phụ huynh) chủ động mở lời trước với con.
- Mục tiêu cốt lõi:
  + Lắng nghe tích cực, đồng hành không phán xét.
  + Tránh ngôn ngữ tra khảo, quy kết ("Tại sao?", "Có phải con yêu đương nhăng nhít không?", "Cấm tiệt!").
  + Tôn trọng sự riêng tư của con, chia sẻ kinh nghiệm tâm lý tuổi mới lớn một cách thấu cảm để con tin tưởng chia sẻ.

[3 HƯỚNG ĐI KHẢ DĨ & HẬU QUẢ THỰC TẾ]
1. Hướng Thấu Cảm & Tôn Trọng (Tốt):
   - Phản xạ: Nhẹ nhàng, đặt câu hỏi gợi mở, công nhận cảm xúc tự nhiên của con, chia sẻ như một người bạn lớn đáng tin cậy.
   - Hậu quả thực tế: Con cảm thấy được lắng nghe và an toàn, sẵn sàng tâm sự mọi chuyện khó khăn ở trường lớp; sợi dây gắn kết gia đình bền chặt. (Thắng).
2. Hướng Ngượng Ngùng / Giáo Điều (Trung gian):
   - Phản xạ: Trò chuyện cứng nhắc, nói chuyện một lúc lại quay về bài ca "chỉ lo học đi", thiếu lắng nghe cảm xúc thật của con.
   - Hậu quả thực tế: Con trả lời ậm ừ qua chuyện, đóng dần cánh cửa tâm sự với cha mẹ.
3. Hướng Độc Đoán & Gay Gắt (Xấu):
   - Phản xạ: Tra khảo, lục lọi đồ đạc, quát mắng, cấm đoán gay gắt và chụp mũ con hư hỏng.
   - Hậu quả thực tế: Con thu mình phòng thủ, nổi loạn, nói dối hoặc tìm kiếm sự giải tỏa từ các mối quan hệ độc hại bên ngoài. (Thua cuộc)."""
    },
    {
        "room_code": "ROOM_BULLYING",
        "title": "Đồng hành cùng bạn: Phòng chống kỳ thị ngoại hình & Bắt nạt",
        "npc_name": "Linh Chi",
        "npc_avatar_url": "/avatars/friend.png",
        "initial_score": 50,
        "target_audience": "CHILD",
        "is_active": True,
        "description": "Đóng vai bạn tốt an ủi, bảo vệ và đồng hành cùng bạn học bị trêu chọc ác ý vì cơ thể phát triển sớm, tìm kiếm sự can thiệp từ giáo viên.",
        "gender_info": "Nữ 13 tuổi (Bạn cùng lớp) - Học sinh (Người chơi)",
        "first_message_sender": "NPC",
        "opening_message": "Cậu ơi... Hồi nãy trong giờ thể dục, mấy bạn nam trong lớp cứ chỉ trỏ ngực mình rồi cười cợt, đặt biệt danh khiếm nhã... Mình xấu hổ và tủi thân muốn khóc quá, mình không muốn đi học nữa...",
        "guide_script": """[BỐI CẢNH TÌNH HUỐNG]
Linh Chi - một bạn nữ học cùng lớp với bạn - có cơ thể dậy thì phát triển sớm hơn các bạn đồng trang lứa. Trong giờ thể dục, Chi vừa bị một nhóm bạn nam soi mói, chỉ trỏ cơ thể và chế giễu bằng những từ ngữ khiếm nhã. Chi đang ngồi khóc một mình ở góc sân trường, tinh thần hoảng loạn và xấu hổ cùng cực.

[VAI TRÒ & MỤC TIÊU CỦA BẠN]
- Vai trò: Bạn tốt cùng lớp.
- Lượt nhắn đầu tiên: Linh Chi (NPC) đau lòng nhắn tin tâm sự với bạn trước.
- Mục tiêu cốt lõi:
  + Lập tức trấn an, xoa dịu cảm xúc tổn thương của bạn.
  + Khẳng định dứt khoát: Sự phát triển tự nhiên của cơ thể là bình thường, người có lỗi là kẻ bắt nạt và trêu chọc khiếm nhã, tuyệt đối không phải lỗi của bạn ấy.
  + Không khuyên bạn cắn răng chịu đựng một mình; khuyến khích và cùng bạn báo cáo với cô chủ nhiệm, phòng tư vấn tâm lý hoặc gia đình để ngăn chặn hành vi quấy rối.

[3 HƯỚNG ĐI KHẢ DĨ & HẬU QUẢ THỰC TẾ]
1. Hướng Đồng Cảm & Bảo Vệ (Tốt):
   - Phản xạ: Lắng nghe, an ủi ấm áp, khẳng định giá trị của bạn và đề nghị cùng bạn đi gặp cô giáo chủ nhiệm để giải quyết dứt điểm trò đùa ác ý.
   - Hậu quả thực tế: Giúp bạn vượt qua khủng hoảng tâm lý, chấm dứt hành vi bắt nạt học đường, xây dựng môi trường lớp học an toàn và nhân ái. (Thắng).
2. Hướng Qua Loa (Trung gian):
   - Phản xạ: An ủi hời hợt ("Thôi kệ chúng nó đi", "Đừng để ý là xong"), hoặc bảo bạn mặc áo khoác che đi để đỡ bị để ý.
   - Hậu quả thực tế: Vô tình củng cố cảm giác tự ti, khiến nạn nhân cảm thấy cô độc và hành vi bắt nạt vẫn tiếp diễn.
3. Hướng Đổ Lỗi Nạn Nhân (Xấu):
   - Phản xạ: Trách ngược lại bạn ("Ai bảo mặc áo chật", "Tại ngực to quá làm chi"), hùa theo trò cười của đám đông.
   - Hậu quả thực tế: Đẩy nạn nhân vào trầm cảm sâu sắc, sợ hãi không dám đến trường, có nguy cơ dẫn đến hành vi tự làm hại bản thân. (Thua cuộc)."""
    }
]

async def migrate_and_seed():
    engine = create_async_engine(db_url, connect_args={"statement_cache_size": 0})
    async with engine.begin() as conn:
        print("1. Adding columns to ai_scenarios if not exist...")
        cols = [
            "ALTER TABLE ai_scenarios ADD COLUMN IF NOT EXISTS description TEXT",
            "ALTER TABLE ai_scenarios ADD COLUMN IF NOT EXISTS guide_script TEXT",
            "ALTER TABLE ai_scenarios ADD COLUMN IF NOT EXISTS first_message_sender VARCHAR(20) DEFAULT 'USER'",
            "ALTER TABLE ai_scenarios ADD COLUMN IF NOT EXISTS opening_message TEXT",
            "ALTER TABLE ai_scenarios ADD COLUMN IF NOT EXISTS gender_info VARCHAR(50)"
        ]
        for col in cols:
            await conn.execute(text(col))
        print("Columns added/verified.")
        
        print("2. Upserting 5 scenarios into ai_scenarios...")
        for sc in SCENARIOS:
            # Check if exists
            res = await conn.execute(
                text("SELECT id FROM ai_scenarios WHERE room_code = :room_code"),
                {"room_code": sc["room_code"]}
            )
            existing = res.scalar()
            if existing:
                print(f"Updating scenario: {sc['room_code']}")
                await conn.execute(
                    text("""
                        UPDATE ai_scenarios
                        SET title = :title,
                            npc_name = :npc_name,
                            npc_avatar_url = :npc_avatar_url,
                            initial_score = :initial_score,
                            target_audience = :target_audience,
                            is_active = :is_active,
                            description = :description,
                            gender_info = :gender_info,
                            first_message_sender = :first_message_sender,
                            opening_message = :opening_message,
                            guide_script = :guide_script
                        WHERE room_code = :room_code
                    """),
                    sc
                )
            else:
                print(f"Inserting scenario: {sc['room_code']}")
                await conn.execute(
                    text("""
                        INSERT INTO ai_scenarios (
                            room_code, title, npc_name, npc_avatar_url,
                            initial_score, target_audience, is_active,
                            description, gender_info, first_message_sender,
                            opening_message, guide_script
                        ) VALUES (
                            :room_code, :title, :npc_name, :npc_avatar_url,
                            :initial_score, :target_audience, :is_active,
                            :description, :gender_info, :first_message_sender,
                            :opening_message, :guide_script
                        )
                    """),
                    sc
                )
        print("All 5 scenarios upserted successfully.")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_and_seed())

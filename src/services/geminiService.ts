import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface StudentSelection {
  description: string;
  cheerMessage: string;
  boundingBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
}

export async function selectRandomStudent(base64Image: string): Promise<StudentSelection> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Bạn là một ứng dụng hỗ trợ giáo viên có tên là "Người được chọn". 
    Nhiệm vụ của bạn là phân tích hình ảnh, xác định tất cả các học sinh có mặt trong khung hình và chọn ra duy nhất một người ngẫu nhiên để trả lời câu hỏi/dò bài.

    Quy trình:
    1. Nhận diện tất cả khuôn mặt học sinh.
    2. Chọn ngẫu nhiên 1 học sinh.
    3. Trả về thông tin dưới dạng JSON.

    Yêu cầu phản hồi:
    - Mô tả đặc điểm nhận dạng của học sinh được chọn (áo, vị trí, phụ kiện) bằng tiếng Việt.
    - Cung cấp tọa độ bounding box [ymin, xmin, ymax, xmax] của khuôn mặt học sinh đó (giá trị từ 0-1000).
    - Đưa ra một câu cổ vũ hài hước để giảm bớt căng thẳng.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: "Quét lớp và chọn giúp mình một bạn may mắn để lên bảng nào!" },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Mô tả đặc điểm nhận dạng" },
          cheerMessage: { type: Type.STRING, description: "Câu cổ vũ hài hước" },
          boundingBox: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER },
            },
            required: ["ymin", "xmin", "ymax", "xmax"],
          },
        },
        required: ["description", "cheerMessage"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Không thể phân tích kết quả từ AI.");
  }
}

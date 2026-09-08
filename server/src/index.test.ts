import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./index.js";

describe("AskDocs API", () => {
  it("GET /api/health API durumunu döndürür", async () => {
    const response = await request(app)
      .get("/api/health")
      .expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.message).toBeTruthy();
  });

  it("GET /api/documents/:id geçersiz kimliği reddeder", async () => {
    const response = await request(app)
      .get("/api/documents/gecersiz-id")
      .expect(400);

    expect(response.body.message).toBe(
      "Geçersiz doküman kimliği."
    );
  });

  it("DELETE /api/documents/:id geçersiz kimliği reddeder", async () => {
    const response = await request(app)
      .delete("/api/documents/gecersiz-id")
      .expect(400);

    expect(response.body.message).toBe(
      "Geçersiz doküman kimliği."
    );
  });

  it("POST /api/documents dosya olmadan yapılan isteği reddeder", async () => {
    const response = await request(app)
      .post("/api/documents")
      .expect(400);

    expect(response.body.message).toBe(
      "Lütfen bir dosya seçin."
    );
  });

  it("POST /api/questions kısa soruyu reddeder", async () => {
    const response = await request(app)
      .post("/api/questions")
      .send({ question: "a" })
      .expect(400);

    expect(response.body.message).toBe(
      "Soru en az 3 karakter olmalıdır."
    );
  });

  it("POST /api/questions uzun soruyu reddeder", async () => {
    const response = await request(app)
      .post("/api/questions")
      .send({ question: "a".repeat(1001) })
      .expect(400);

    expect(response.body.message).toBe(
      "Soru en fazla 1000 karakter olabilir."
    );
  });
});
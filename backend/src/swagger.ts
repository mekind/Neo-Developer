import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('MyClaw Backend API')
    .setDescription(
      'NestJS 백엔드 — 비개발자가 대화로 AI 에이전트를 정의하는 MyClaw 플랫폼의 데이터/통합 레이어. ' +
        '온보딩/Persona Builder는 별도 Claude 세션, 런타임은 OpenClaw, 백엔드는 Memory 영속화 + 도메인 CRUD + 제약 enforcement.',
    )
    .setVersion('0.1.0')
    .addTag('health', '서비스 헬스 + DB ping')
    .addTag('users', 'BE-02 — 사용자/온보딩 프로필')
    .addTag('memory', 'BE-03 — llm-wiki 패턴 마크다운 문서 저장')
    .addTag('agents', 'BE-04 — 사용자당 ≤3개 에이전트, persona/SOUL/config')
    .addTag('skills', 'BE-05 — 사전 정의 Skill 카탈로그')
    .addTag('greetings', 'BE-06 — SOUL.md 기반 인사말 랜덤 픽 (LLM 호출 없음)')
    .addTag('items', '데모용 mock CRUD (추후 제거 예정)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:4200'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.setGlobalPrefix('api');
    const port = 3000;
    await app.listen(port);
    console.log(`🚀 Backend running on: http://localhost:${port}`);
}
bootstrap().catch(error => {
    console.error('Error starting application:', error);
    process.exit(1);
});
//# sourceMappingURL=main-simple.js.map
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { APP_INITIALIZER } from '@angular/core';
import { AppConfigService } from './app/core/services/app-config.service';

function initApp(appConfigService: AppConfigService) {
	return () => appConfigService.load();
}

bootstrapApplication(App, {
	...appConfig,
	providers: [
		...(appConfig.providers || []),
		AppConfigService,
		{ provide: APP_INITIALIZER, useFactory: initApp, deps: [AppConfigService], multi: true }
	]
}).catch((err) => console.error(err));

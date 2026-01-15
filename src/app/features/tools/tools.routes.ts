import { Routes } from '@angular/router';

export const TOOLS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tools-shell/tools-shell').then(m => m.ToolsShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./tools-home/tools-home').then(m => m.ToolsHome),
      },
      {
        path: 'json',
        loadComponent: () =>
          import('./json-tool/json-tool').then(m => m.JsonTool),
      },
      {
        path: 'regex',
        loadComponent: () =>
          import('./regex/regex-tools').then(m => m.RegexTools),
      },
      // En proceso 
      /* {
        path: 'encode',
        loadComponent: () =>
          import('./encode/encode-tool').then(m => m.EncodeTool),
      },
      {
        path: 'jwt',
        loadComponent: () =>
          import('./jwt/jwt-tool').then(m => m.JwtTool),
      },
      {
        path: 'css',
        loadComponent: () =>
          import('./css/css-tool').then(m => m.CssTool),
      },
      {
        path: 'contrast',
        loadComponent: () =>
          import('./contrast/contrast-tool').then(m => m.ContrastTool),
      },
      {
        path: 'http',
        loadComponent: () =>
          import('./http/http-tool').then(m => m.HttpTool),
      },
      {
        path: 'git',
        loadComponent: () =>
          import('./git/git-tool').then(m => m.GitTool),
      },
      {
        path: 'dates',
        loadComponent: () =>
          import('./dates/dates-tool').then(m => m.DatesTool),
      },
      {
        path: 'linter',
        loadComponent: () =>
          import('./linter/linter-tool').then(m => m.LinterTool),
      }, */
    ],
  },
];

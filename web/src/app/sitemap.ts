import { MetadataRoute } from 'next';
import { basePath, locales } from '@/config/site';
import { getInfo } from '@bigfive-org/results';

const resultLanguages = getInfo().languages.map((l) => l.id);

export default function sitemap(): MetadataRoute.Sitemap {
  const alternatesPageLang = (path: string = '') =>
    locales.reduce((a, v) => ({ ...a, [v]: basePath + `/${v}${path}` }), {});
  const alternatesParamsLang = (path: string = '') =>
    resultLanguages.reduce(
      (a, v) => ({ ...a, [v]: basePath + `${path}&amp;lang=${v}` }),
      {}
    );
  return [
    {
      url: basePath,
      lastModified: new Date(),
      alternates: {
        languages: alternatesPageLang()
      }
    },
    {
      url: basePath,
      lastModified: new Date(),
      alternates: {
        languages: alternatesPageLang('/result')
      }
    },
    {
      url: `${basePath}/result/58a70606a835c400c8b38e84?showExpanded=true`,
      lastModified: new Date(),
      alternates: {
        languages: alternatesParamsLang(
          '/result/58a70606a835c400c8b38e84?showExpanded=true'
        )
      }
    },
    {
      url: `${basePath}/test`,
      lastModified: new Date()
    },
    {
      url: `${basePath}/faq`,
      lastModified: new Date()
    },
    {
      url: `${basePath}/privacy`,
      lastModified: new Date()
    }
  ];
}

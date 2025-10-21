'use client';

import React, { useState } from 'react';
import { useTranslation } from '../i18n/client';

interface FAQProps {
  lang: string;
}

export default function FAQ({ lang }: FAQProps) {
  const { t } = useTranslation(lang, 'home');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = ['q1', 'q2', 'q3', 'q4', 'q5'];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
          {t('faq')}
        </h2>
        <p className="text-lg text-neutral-600">
          {t('faqSubtitle')}
        </p>
      </div>

      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div
            key={item}
            className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
              aria-expanded={openIndex === index}
            >
              <span className="text-lg font-semibold text-black pr-8">
                {t(`faqItems.${item}.question`)}
              </span>
              <svg
                className={`w-6 h-6 text-neutral-600 flex-shrink-0 transition-transform duration-300 ${
                  openIndex === index ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="px-6 pb-6 text-neutral-600 leading-relaxed">
                {t(`faqItems.${item}.answer`)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              {lang === 'zh-CN' && '还有其他问题？'}
              {lang === 'en' && 'Have more questions?'}
              {lang === 'ja' && '他にご質問はありますか？'}
            </h3>
            <p className="text-purple-800 mb-4">
              {lang === 'zh-CN' && '如果您有任何其他问题或需要帮助，请随时联系我们的支持团队。'}
              {lang === 'en' && 'If you have any other questions or need assistance, please feel free to contact our support team.'}
              {lang === 'ja' && 'その他のご質問やサポートが必要な場合は、お気軽にサポートチームにお問い合わせください。'}
            </p>
            <a
              href={`/${lang}/contact`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors duration-200"
            >
              {lang === 'zh-CN' && '联系我们'}
              {lang === 'en' && 'Contact Us'}
              {lang === 'ja' && 'お問い合わせ'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
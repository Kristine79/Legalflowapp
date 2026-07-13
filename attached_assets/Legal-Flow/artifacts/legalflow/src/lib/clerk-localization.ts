import { ruRU } from '@clerk/localizations';
import type { LocalizationResource } from '@clerk/types';

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item) && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: T): T {
  const result = { ...target } as T;
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key] as unknown;
      const targetValue = result[key] as unknown;
      if (isObject(targetValue) && isObject(sourceValue)) {
        (result as Record<string, unknown>)[key] = deepMerge(targetValue, sourceValue);
      } else {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }
  return result;
}

const customOverrides: Record<string, unknown> = {
  socialButtonsBlockButton: 'Продолжить через {{provider}}',
  socialButtonsBlockButtonManyInView: 'Продолжить через {{provider}}',
  dividerText: 'или',
  formFieldLabel__emailAddress: 'Электронная почта',
  formFieldLabel__emailAddresses: 'Электронные адреса',
  formFieldLabel__password: 'Пароль',
  formFieldLabel__currentPassword: 'Текущий пароль',
  formFieldLabel__newPassword: 'Новый пароль',
  formFieldLabel__confirmPassword: 'Подтвердите пароль',
  formFieldInputPlaceholder__emailAddress: 'name@example.com',
  formFieldInputPlaceholder__password: 'Введите пароль',
  formFieldAction__forgotPassword: 'Забыли пароль?',
  formFieldHintText__optional: 'необязательно',
  formButtonPrimary: 'Продолжить',
  formButtonPrimary__verify: 'Подтвердить',
  signInEnterPasswordTitle: 'Введите пароль',
  backButton: 'Назад',
  footerActionLink__useAnotherMethod: 'Использовать другой способ',
  footerActionLink__alternativePhoneCodeProvider: 'Использовать другой способ',
  badge__primary: 'Основной',
  badge__thisDevice: 'Это устройство',
  badge__userDevice: 'Устройство пользователя',
  badge__default: 'По умолчанию',
  badge__unverified: 'Не подтверждён',
  badge__requiresAction: 'Требуется действие',
  badge__you: 'Вы',
  footerPageLink__help: 'Помощь',
  footerPageLink__privacy: 'Конфиденциальность',
  footerPageLink__terms: 'Условия использования',
  signUp: {
    start: {
      title: 'Создать аккаунт',
      subtitle: 'Начните вести дела с AI-помощником',
      actionText: 'Уже есть аккаунт?',
      actionLink: 'Войти',
      actionLink__use_email: 'Использовать email',
      actionLink__use_phone: 'Использовать телефон',
    },
    continue: {
      title: 'Завершить регистрацию',
      subtitle: 'Заполните оставшиеся данные',
      actionText: 'Уже есть аккаунт?',
      actionLink: 'Войти',
    },
    emailLink: {
      title: 'Подтвердите email',
      subtitle: 'Перейдите по ссылке из письма',
      formTitle: 'Ссылка для подтверждения',
      formSubtitle: 'Нажмите на ссылку, отправленную на ваш email',
      resendButton: 'Отправить повторно',
      verified: {
        title: 'Email подтверждён',
      },
      loading: {
        title: 'Подтверждаем...',
      },
      verifiedSwitchTab: {
        title: 'Письмо открыто в новой вкладке',
        subtitle: 'Вернитесь сюда, чтобы продолжить',
        subtitleNewTab: 'Вернитесь в предыдущую вкладку',
      },
      clientMismatch: {
        title: 'Несовпадение клиента',
        subtitle: 'Попробуйте открыть ссылку в том же браузере',
      },
    },
    emailCode: {
      title: 'Подтвердите email',
      subtitle: 'Введите код подтверждения, отправленный на ваш email',
      formTitle: 'Код подтверждения',
      formSubtitle: 'Введите код из письма',
      resendButton: 'Не получили код? Отправить повторно',
    },
    phoneCode: {
      title: 'Подтвердите телефон',
      subtitle: 'Введите код из SMS',
      formTitle: 'Код подтверждения',
      formSubtitle: 'Введите код, отправленный на ваш телефон',
      resendButton: 'Отправить повторно',
    },
    legalConsent: {
      continue: {
        title: 'Подтвердите согласие',
        subtitle: 'Примите условия, чтобы продолжить',
      },
      checkbox: {
        label__termsOfServiceAndPrivacyPolicy: 'Я согласен с {{termsOfServiceLink}} и {{privacyPolicyLink}}',
        label__onlyPrivacyPolicy: 'Я согласен с {{privacyPolicyLink}}',
        label__onlyTermsOfService: 'Я согласен с {{termsOfServiceLink}}',
      },
    },
  },
  signIn: {
    start: {
      title: 'Вход в AI-платформу для управления юридической практикой',
      subtitle: 'Войдите, чтобы продолжить работу',
      actionText: 'Нет аккаунта?',
      actionLink: 'Создать аккаунт',
      actionLink__use_email: 'Использовать email',
      actionLink__use_phone: 'Использовать телефон',
      actionLink__use_username: 'Использовать имя пользователя',
      actionLink__use_passkey: 'Использовать passkey',
    },
    password: {
      title: 'Введите пароль',
      subtitle: 'Введите пароль для {{applicationName}}',
      actionLink: 'Использовать другой способ',
    },
    forgotPasswordAlternativeMethods: {
      title: 'Забыли пароль?',
      label__alternativeMethods: 'Или используйте другой способ',
      blockButton__resetPassword: 'Сбросить пароль',
    },
    forgotPassword: {
      title: 'Сброс пароля',
      subtitle: 'Введите email, чтобы получить ссылку для сброса',
      subtitle_email: 'Введите email, чтобы получить ссылку',
      subtitle_phone: 'Введите телефон, чтобы получить код',
      formTitle: 'Сброс пароля',
      resendButton: 'Отправить повторно',
    },
    resetPassword: {
      title: 'Новый пароль',
      formButtonPrimary: 'Сохранить пароль',
      successMessage: 'Пароль успешно изменён',
      requiredMessage: 'Требуется для входа в систему',
    },
    emailCode: {
      title: 'Подтвердите email',
      subtitle: 'Введите код подтверждения, отправленный на ваш email',
      formTitle: 'Код подтверждения',
      resendButton: 'Не получили код? Отправить повторно',
    },
    emailLink: {
      title: 'Подтвердите email',
      subtitle: 'Перейдите по ссылке из письма',
      formTitle: 'Ссылка для подтверждения',
      resendButton: 'Отправить повторно',
    },
  },
  passwordComplexity: {
    sentencePrefix: 'Пароль должен содержать:',
    minimumLength: 'минимум {{length}} символов',
    maximumLength: 'максимум {{length}} символов',
    requireNumbers: 'цифры',
    requireLowercase: 'строчные буквы',
    requireUppercase: 'заглавные буквы',
    requireSpecialCharacter: 'спецсимволы',
  },
  zxcvbn: {
    notEnough: 'Пароль слишком простой',
    couldBeStronger: 'Пароль можно сделать надёжнее',
    goodPassword: 'Ваш пароль соответствует всем требованиям',
    warnings: {
      straightRow: 'Простая последовательность клавиш',
      keyPattern: 'Короткая повторяющаяся комбинация',
      simpleRepeat: 'Повторяющиеся символы',
      extendedRepeat: 'Повторяющийся паттерн',
      sequences: 'Последовательные символы',
      recentYears: 'Недавние годы легко угадать',
      dates: 'Даты легко угадать',
      topTen: 'Очень распространённый пароль',
      topHundred: 'Часто используемый пароль',
      common: 'Распространённый пароль',
      similarToCommon: 'Похож на распространённый пароль',
      wordByItself: 'Одиночное слово легко угадать',
      namesByThemselves: 'Имена легко угадать',
      commonNames: 'Распространённые имена легко угадать',
      userNames: 'Имена пользователей легко угадать',
      pwned: 'Пароль был скомпрометирован в утечке данных',
    },
  },
  paymentMethod: {
    dev: {
      testCardInfo: 'Тестовая карта',
      developmentMode: 'Тестовый режим',
      cardNumber: 'Номер карты',
      expirationDate: 'Срок действия',
      cvcZip: 'CVC / ZIP',
      anyNumbers: 'Любые цифры',
    },
  },
  form_param_format_invalid__email_address: 'Некорректный формат email',
  form_param_type_invalid__email_address: 'Некорректный тип email',
  form_password_length_too_short: 'Пароль слишком короткий',
  form_password_not_strong_enough: 'Пароль недостаточно надёжный',
  form_password_incorrect: 'Неверный пароль',
  form_password_or_identifier_incorrect: 'Неверный email или пароль',
  form_identifier_exists: 'Этот email уже используется',
  form_param_value_invalid: 'Некорректное значение',
  not_allowed_access: 'Доступ запрещён',
  oauth_access_denied: 'Доступ отклонён',
  form_code_incorrect: 'Неверный код',
};

export const clerkRuLocalization = deepMerge(
  ruRU as LocalizationResource,
  customOverrides as LocalizationResource,
);

const categories = {
	payment_status:    {
		label_title:          'Статус оплаты',
		label_hello:          'Добрый день,',
		label_order_id:       'Заказ ID:',
		label_status_order:   'Статус оплаты:',
		label_payment_method: 'Метод оплаты:',
		label_amount:         'Сумма:',
		label_king_regards:   'С наилучишими пожеланиями,',
		label_plabel:         'PLABEL COMPANY',
	},
	order_invoice:     {
		label_invoice:       'Подтверждение оплаты',
		label_invoice_date:  'ДАТА',
		label_address:       'АДРЕС',
		label_order_id:      'ID ЗАКАЗА',
		label_order:         'Ваш заказ',
		label_color:         'Цвет:',
		label_size:          'Размер:',
		label_number:        'Количество:',
		label_subtotal:      'Промежуточный итог:',
		label_delivery:      'Доставка:',
		label_free:          'БЕСПЛАТНО',
		label_total:         'ИТОГ:',
		label_shipping:      'Мы вышлем вам номер слежнения посылки, после того как заказ будет отправлен.',
		label_account:       'Подробности заказа доступны в личном кабинете пользователя',
		label_visit_account: 'Перейти в личный кабинет пользователя.',
		label_support:       'Обратитесь в нашу службу поддержки клиентов, если у вас есть вопросы.',
		label_visit_support: 'Перейти на страницу службы поддержки PLABEL COMPANY.',
	},
	default:           {
		label_terms_use:                'Условия использования веб-сайта',
		label_policy_shipping_delivery: 'Политика доставки',
		sale_policy:                    'Политика продаж',
		return_policy:                  'Политика возврата',
		year:                           (() => {
			return new Date().getFullYear();
		})(),
		label_get_help:                 'Обратитесь в нашу службу поддержки клиентов, если у вас есть вопросы.',
		label_visit_support:            'Посетить страницу службы поддержки PLABEL COMPANY.',
	},
	colors:            {
		RED:   'Красный',
		GREY:  'Серый',
		BLACK: 'Черный'
	},
	transactionStatus: {
		cancelled: 'Отменено',
		canceled:  'Отменено',
		error:     'Ошибка',
		new:       'Новый',
		pending:   'В реализации',
		settled:   'Реализовано'
	},
};

module.exports = categories;

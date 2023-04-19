import { createContext, ReactNode, useContext, useMemo } from "react";

let DefaultOptions: Intl.DateTimeFormatOptions = {
	year: "numeric",
	month: "numeric",
	day: "numeric",
	hour: "numeric",
	minute: "numeric",
	second: "numeric",
};

type DateTimeProps = {
	value: Date | string | number;
	locale?: string | Array<string>;
	options?: Intl.DateTimeFormatOptions;
};

type DateTimeProviderProps = Omit<DateTimeProps, "value">;

let DateTimeCtx = createContext<DateTimeProviderProps>({
	locale: "default",
	options: DefaultOptions,
});

export let DateTimeProvider = ({
	children,
	...props
}: DateTimeProviderProps & { children: ReactNode }) => {
	return <DateTimeCtx.Provider value={props}>{children}</DateTimeCtx.Provider>;
};

export let DateTime = ({ value, locale, options }: DateTimeProps) => {
	let { locale: defaultLocale, options: defaultOptions } =
		useContext(DateTimeCtx);

	let date = useMemo(() => {
		let date = value instanceof Date ? value : new Date(value);

		return new Intl.DateTimeFormat(
			locale ?? defaultLocale,
			options ?? defaultOptions,
		).format(date);
	}, [value]);

	return <>{date}</>;
};

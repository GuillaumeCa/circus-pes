import { IntlShape } from "react-intl";
import { defaultErrorMap, ZodErrorMap, ZodIssueCode } from "zod";

export type MakeZodIntlMap = (option: ZodIntlMapOption) => ZodErrorMap;
export type ZodIntlMapOption = {
  intl: IntlShape;
};

export const makeZodIntlMap: MakeZodIntlMap =
  ({ intl }) =>
  (issue, ctx) => {
    let message: string;
    message = defaultErrorMap(issue, ctx).message;
    switch (issue.code) {
      case ZodIssueCode.custom:
        message = intl.formatMessage({
          id: issue.params?.id,
          defaultMessage: issue.message,
        });
        break;
    }

    return { message };
  };

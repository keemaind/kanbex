/**
 * Единая точка доступа приложения к Material-компонентам.
 * Страницы и feature-код импортируют эти алиасы из `@kanbex/ui`,
 * а не из `m3-expressive-react` напрямую.
 */
export {
  IconButton as AppIconButton,
  LinearProgressIndicator as AppLinearProgress,
  Menu as AppMenu,
  MenuItem as AppMenuItem,
  NavigationDrawer as AppNavigationDrawer,
  NavigationDrawerItem as AppNavigationDrawerItem,
  Option as AppOption,
  Select as AppSelect,
  TextField as AppTextField,
  ThemeProvider as AppThemeProvider,
} from 'm3-expressive-react'

export type {
  IconButtonProps as AppIconButtonProps,
  LinearProgressIndicatorProps as AppLinearProgressProps,
  MenuItemProps as AppMenuItemProps,
  MenuProps as AppMenuProps,
  NavigationDrawerItemProps as AppNavigationDrawerItemProps,
  NavigationDrawerProps as AppNavigationDrawerProps,
  OptionProps as AppOptionProps,
  SelectProps as AppSelectProps,
  TextFieldProps as AppTextFieldProps,
  ThemeProviderProps as AppThemeProviderProps,
} from 'm3-expressive-react'

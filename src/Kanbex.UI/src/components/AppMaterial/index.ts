/**
 * Единая точка доступа приложения к Material-компонентам.
 * Страницы и feature-код импортируют эти алиасы из `@kanbex/ui`,
 * а не из `m3-expressive-react` напрямую.
 */
export {
  Carousel as AppCarousel,
  CarouselItem as AppCarouselItem,
  IconButton as AppIconButton,
  LinearProgressIndicator as AppLinearProgress,
  Menu as AppMenu,
  MenuItem as AppMenuItem,
  NavigationDrawer as AppNavigationDrawer,
  NavigationDrawerItem as AppNavigationDrawerItem,
  NavigationRail as AppNavigationRail,
  NavigationRailAction as AppNavigationRailAction,
  NavigationRailItem as AppNavigationRailItem,
  Option as AppOption,
  SearchBar as AppSearchBar,
  Select as AppSelect,
  Switch as AppSwitch,
  TextField as AppTextField,
  ThemeProvider as AppThemeProvider,
} from 'm3-expressive-react'

export type {
  CarouselItemProps as AppCarouselItemProps,
  CarouselProps as AppCarouselProps,
  IconButtonProps as AppIconButtonProps,
  LinearProgressIndicatorProps as AppLinearProgressProps,
  MenuItemProps as AppMenuItemProps,
  MenuProps as AppMenuProps,
  NavigationDrawerItemProps as AppNavigationDrawerItemProps,
  NavigationDrawerProps as AppNavigationDrawerProps,
  NavigationRailActionProps as AppNavigationRailActionProps,
  NavigationRailItemProps as AppNavigationRailItemProps,
  NavigationRailProps as AppNavigationRailProps,
  OptionProps as AppOptionProps,
  SearchBarProps as AppSearchBarProps,
  SelectProps as AppSelectProps,
  SwitchProps as AppSwitchProps,
  TextFieldProps as AppTextFieldProps,
  ThemeProviderProps as AppThemeProviderProps,
} from 'm3-expressive-react'

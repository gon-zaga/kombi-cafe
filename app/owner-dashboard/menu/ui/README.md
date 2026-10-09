# Ingredient Requirement Implementation

This document summarizes the changes made to ensure that menu items always require at least one ingredient.

## Changes Made

### 1. Backend Validation (`/app/api/menu/route.ts`)
- Added validation to require at least one recipe ingredient when creating/updating menu items
- Returns 400 error with message "Missing required fields: at least one ingredient is required" if no ingredients provided

### 2. Add Item Modal (`/app/owner-dashboard/menu/ui/AddItemModal.tsx`)
- Added ingredient selection UI with quantity and size specification
- Integrated AddingIngredientModal to create new ingredients
- Modified form submission to include recipe data in API request
- Added validation to ensure at least one ingredient is selected before allowing submission

### 3. Recipe Editor (`/app/owner-dashboard/menu/ui/RecipeEditor.tsx`)
- Added imperative handle via `useImperativeHandle` to expose `isValid()` method
- `isValid()` returns `true` when `recipes.length > 0`, `false` otherwise
- Changed export to use `forwardRef` to allow ref access

### 4. Recipe Modal (`/app/owner-dashboard/menu/ui/RecipeModal.tsx`)
- Added ref to access RecipeEditor instance
- Created `handleClose` function that checks validity before closing
- Shows error toast "Please add at least one ingredient before closing." when trying to exit with no ingredients
- Both backdrop click and X button use the validated close handler

## Behavior

### When Creating New Items:
- User must select at least one ingredient (with quantity and size) before being able to submit the Add Item form
- "+ New Ingredient" button allows creating new ingredients without leaving the form
- Form validation prevents submission with zero ingredients

### When Editing Existing Items:
- User cannot close the Recipe Editor modal without adding at least one ingredient
- Trying to close with zero ingredients shows error toast: "Please add at least one ingredient before closing."
- Both clicking the X button and clicking outside the modal are blocked until ingredients are added
- Once at least one ingredient is added, normal closing behavior resumes

## Technical Details

The solution uses React refs and imperative handles to:
1. Expose internal state validation methods from child components (RecipeEditor)
2. Allow parent components (RecipeModal) to check child validity before allowing certain actions (closing)
3. Provide immediate user feedback when validation fails
4. Maintain separation of concerns while enabling cross-component validation

This approach ensures the ingredient requirement is enforced consistently across both creation and editing workflows.
# [AMAZON-Q-TASK] URGENT: Workflow Engine Data Validation Debug

## Task Assignment

**Assigned Tool**: Amazon Q (Claude 3.7)
**Priority**: CRITICAL
**Estimated Time**: 1-2 hours
**Task ID**: Workflow Engine Debug - Data Validation Step

## Critical Issue Analysis

The recent edit to `backend/app/services/workflow_engine.py` has introduced critical syntax and structural errors:

### Identified Problems

1. **Indentation Error**: Line 437 has incorrect indentation for `async def _execute_data_validation_step`
2. **Incomplete Implementation**: Data validation logic is cut off mid-implementation
3. **Missing Import**: `jsonschema` module not imported but used in validation
4. **Incomplete Control Flow**: Validation logic incomplete, missing error handling
5. **Orphaned Code**: Lines 451+ contain disconnected code fragments

### Error Context

```python
# BROKEN CODE STRUCTURE:
        async def _execute_data_validation_step(  # Wrong indentation
            self, node: Dict[str, Any], input_data: Dict[str, Any]
        ) -> Dict[str, Any]:
            """Execute data validation step using schema from node definition."""
            node_data = node.get("data", {})
            validation_schema = node_data.get("validation_schema")

            if not validation_schema:
                raise WorkflowStepError("No validation schema defined for data validation step")

            try:
                # Validate input data against schema
                validator = jsonschema.Draft7Validator(validation_schema)  # Missing import
                if not validator.is_valid(input_data):  # Incomplete logic
        operation = node_data.get("operation", "passthrough")  # Orphaned code
```

## Required Fixes

### 1. Syntax and Structure Fixes

- Fix indentation for `_execute_data_validation_step` method
- Complete the data validation implementation
- Add proper error handling and return statements
- Remove orphaned code fragments

### 2. Import Dependencies

- Add `import jsonschema` to file imports
- Verify jsonschema is in requirements.txt
- Add to requirements if missing

### 3. Complete Implementation

- Finish validation logic with proper error messages
- Add comprehensive error handling for validation failures
- Ensure proper return format matches other step methods
- Add logging for validation results

### 4. Integration Testing

- Verify method integrates properly with workflow execution
- Test with sample validation schemas
- Ensure error handling doesn't break workflow execution
- Validate return format consistency

## Expected Outcome

- **Syntax Errors**: All resolved, code compiles without errors
- **Complete Implementation**: Full data validation step functionality
- **Error Handling**: Comprehensive validation error reporting
- **Integration**: Seamless integration with existing workflow engine

## Files to Fix

- `backend/app/services/workflow_engine.py` - Primary fix target
- `backend/requirements.txt` - Add jsonschema if missing
- Any related test files that may be affected

## Success Criteria

- [ ] Code compiles without syntax errors
- [ ] Data validation step executes successfully
- [ ] Proper error handling for invalid data
- [ ] Integration tests pass
- [ ] No regression in existing workflow functionality

## Priority Justification

This is blocking critical workflow engine functionality and preventing proper system operation. Must be fixed before any other development can proceed.

## Handoff to Cline

After Amazon Q completes the debugging:

1. Cline can implement additional validation features
2. Cline can add comprehensive test coverage
3. Cline can enhance validation schema support
4. Cline can add validation step UI components

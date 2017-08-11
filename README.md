# TsToolBox
> Toolkit for building scalable web applications with TypeScript, React, Redux and Apollo-Client (inspired by [ReKit](https://github.com/supnate/rekit))


⚠⚠⚠ Work in Progress ⚠⚠⚠

⚠⚠⚠ Experimental Tool ⚠⚠⚠

> The tool follows an architectural style (see below) which might not meet your app architecture.
If you have suggestions for generalization, please feel free to file an issue. 
Any discussion about the architecture is very welcome. 


Command line tool to manage actions, reducers, components and apollo queries/mutations.

Typescript provides a great way for statical analysis of your application's code. When using typescript with react, 
redux and apollo-client however, additional code is necessary which can not be inferred by the typescript compiler. 
Writing this additional code can make development a little bit more complicated or slower.

You can use this tool to create/rename/move/delete those elements with all the necessary 
Typescript code. 

![Example of 'add-Action' task](http://imgur.com/WMGhwyT)

## Installation

yarn:

```sh
yarn add ts-tool-box --dev
```

npm:
```sh
npm install ts-tool-box --save-dev
```

## Usage

Currently, the following tasks are supported:

- add-action:
    - Arguments:
        - Path of UI Component
        - Action name 

```>ts-tool-box add-action ./app/components/my-component/ NewAction```

- If there is no file `actions.ts` in the specified path yet, this will create a new file with the following content:
    
    ```
    export const NEW_ACTION = "NEW_ACTION";
    interface NewAction {
        readonly type: typeof ActionTypes.NEW_ACTION;
    }
    export const createNewAction = (): NewAction => {
        return { type: ActionTypes.NewAction };
    };
    export type Action = NewAction;
    const ActionTypes = { NewAction: (<typeof NEW_ACTION>NEW_ACTION) };
    ```
- If there is a `action.ts` in the specified path with the following content:

    ```
    export const EXISTING_ACTION = "EXISTING_ACTION";
    interface ExistingAction {
        readonly type: typeof ActionTypes.EXISTING_ACTION;
    }
    export const createExistingAction = (): ExistingAction => {
        return { type: ActionTypes.ExistingAction };
    };
    export type Action = ExistingAction;
    const ActionTypes = { ExistingAction: (<typeof EXISTING_ACTION>EXISTING_ACTION) }
    ```
    
    It will be modified to:
    
    ```
    export const EXISTING_ACTION = "EXISTING_ACTION";
    interface ExistingAction {
        readonly type: typeof ActionTypes.EXISTING_ACTION;
    }
    export const createExistingAction = (): ExistingAction => {
        return { type: ActionTypes.ExistingAction };
    };
    export const NEW_ACTION = "NEW_ACTION";
    interface NewAction {
        readonly type: typeof ActionTypes.NEW_ACTION;
    }
    export const createNewAction = (): NewAction => {
        return { type: ActionTypes.NewAction };
    };
    export type Action = ExistingAction | NewAction;
    const ActionTypes = { ExistingAction: (<typeof EXISTING_ACTION>EXISTING_ACTION), NewAction: (<typeof NEW_ACTION>NEW_ACTION) };
    ```

- add-reducer:
TBD

- add-sub-reducer:
TBD


## Development setup

```sh
yarn install

```

## Release History

* 0.0.1
    * Work in progress

## Meta

Marian Palkus – [@mpalkus](https://twitter.com/mpalkus)

[https://github.com/MarianPalkus](https://github.com/MarianPalkus/)

## Contributing

Feel free to report issues, file change requests, fork the repository or start a pull request. 
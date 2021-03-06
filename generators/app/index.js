'use strict';

let Generator = require('yeoman-generator');
let validator = require('./validator');
let helper = require('./helper');
let yosay = require('yosay');
let path = require('path');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument('moduleUid', { type: String, required: false });
        // Not using Number for unitNumber since it didn't play well with debug arguments being strings.
        this.argument('unitNumber', { type: String, required: false });
        this.argument('unitPublishDate', { type: String, required: false });
        this.argument('authorGitHubId', { type: String, required: false });
        this.argument('authorMicrosoftId', { type: String, required: false });
        this.argument('msProdValue', { type: String, required: false });
        // TODO: Maybe make custom type parser for msProdValue that is then used in the prompt (https://yeoman.io/authoring/user-interactions.html#arguments).
        // TODO: Put question parameters in place here. (Might not be straightforward with arbitrary question and answer counts.)

        this.outputConfig = {};
        this.convertToId = helper.convertToId;
    }

    initializing() {
        // Welcome
        this.log(yosay('Welcome to the Microsoft Learn knowledge check generator!'));
    }

    prompting() {
        let generator = this;
        let prompts = {
            askForModuleUid: () => {
                let uid = generator.options['moduleUid'];
                if (uid && validator.validateNonEmpty(uid)) {
                    // Provided via argument. No need to prompt.
                    generator.outputConfig.moduleUid = uid;
                    return Promise.resolve();
                }

                return generator.prompt({
                    type: 'input',
                    name: 'moduleUid',
                    message: 'What\'s the uid for your knowledge check\'s parent module?',
                    validate: validator.validateNonEmpty
                }).then(answers => {
                    generator.outputConfig.moduleUid = answers.moduleUid;
                });
            },
            askForUnitNumber: () => {
                let unitNumber = generator.options['unitNumber'];
                if (unitNumber && validator.validateNonEmpty(unitNumber)) {
                    // Provided via argument. No need to prompt.
                    generator.outputConfig.unitNumber = unitNumber;
                    return Promise.resolve();
                }

                return generator.prompt({
                    type: 'input',
                    name: 'unitNumber',
                    message: 'What\'s the unit number for your knowledge check unit?',
                    validate: validator.validateIntegerString
                }).then(answers => {
                    generator.outputConfig.unitNumber = answers.unitNumber;
                });
            },
            askForPublishDate: () => {
                let unitPublishDate = generator.options['unitPublishDate'];
                if (unitPublishDate && validator.validatePublishDateString(unitPublishDate)) {
                    // Provided via argument. No need to prompt.
                    generator.outputConfig.unitPublishDate = unitPublishDate;
                    return Promise.resolve();
                }

                return generator.prompt({
                    type: 'input',
                    name: 'unitPublishDate',
                    message: 'What is the publish date of this unit ("MM/dd/yyyy")?',
                    /**
                     *
                     * @param {date} Date
                     */
                    default: (function (date) {
                        let month = date.getMonth() + 1; // because JavaScript reasons (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMonth)
                        let day = date.getDate();
                        let year = date.getFullYear();
                        /**
                         *
                         * @param {source} string
                         * @param {pad} string
                         * @param {length} number
                         */
                        let leftPad = function(source, pad, length) {
                            let paddedResult = source + ""; // Make sure it's really a string.
                            while (paddedResult.length < length) {
                                paddedResult = pad + paddedResult;
                            }
                            return paddedResult;
                        };
                        return leftPad(month, "0", 2) + "/" + leftPad(day, "0", 2) + "/" + year;
                    })(new Date()),
                    validate: validator.validatePublishDateString
                }).then(answers => {
                    generator.outputConfig.unitPublishDate = answers.unitPublishDate;
                });
            },
            askForAuthorGitHubId: () => {
                let authorGitHubId = generator.options['authorGitHubId'];
                if (authorGitHubId) {
                    // Provided via argument. No need to prompt.
                    generator.outputConfig.authorGitHubId = authorGitHubId;
                    return Promise.resolve();
                }

                return generator.prompt({
                    type: 'input',
                    name: 'authorGitHubId',
                    message: 'What is the GitHub username for the author?'
                }).then(answers => {
                    generator.outputConfig.authorGitHubId = answers.authorGitHubId;
                });
            },
            askForAuthorMicrosoftId: () => {
                let authorMicrosoftId = generator.options['authorMicrosoftId'];
                if (authorMicrosoftId) {
                    // Provided via argument. No need to prompt.
                    generator.outputConfig.authorMicrosoftId = authorMicrosoftId;
                    return Promise.resolve();
                }

                return generator.prompt({
                    type: 'input',
                    name: 'authorMicrosoftId',
                    message: 'What is the Microsoft username for the author?'
                }).then(answers => {
                    generator.outputConfig.authorMicrosoftId = answers.authorMicrosoftId;
                });
            },
            askForMicrosoftProductValue: () => {
                const values = [
                    // Pulled from https://review.docs.microsoft.com/en-us/new-hope/information-architecture/metadata/taxonomies?branch=master#learn-product
                    // Via jQuery call: `$("#product").next().next().find("tr").filter(function (i, e) { return $(e).find("td:last").text() === "1"; }).find("td:first").map(function () { return "{\n\tvalue: \"" + $(this).text() + "\"\n},\n"; }).get().join("")`
                    // FUTURE: Pull from an up-to-date list directly.
                    // TODO: Determine if name is required or if it can be inferred from value.
                    {
                        value: "learning-dotnet"
                    },
                    {
                        value: "learning-azure"
                    },
                    {
                        value: "learning-dynamics"
                    },
                    {
                        value: "learning-office"
                    },
                    {
                        value: "learning-power-platform"
                    },
                    {
                        value: "learning-skype"
                    },
                    {
                        value: "learning-vs"
                    },
                    {
                        value: "learning-windows"
                    },
                ];
                const cliValue = generator.options['msProdValue'];
                if (cliValue) {
                    const matchedValue = values.filter((value) => value.value.toLowerCase() === cliValue.toLowerCase());
                    if (matchedValue.length >= 1) {
                        // Provided via argument. No need to prompt.
                        generator.outputConfig.msProdValue = matchedValue[0];
                        return Promise.resolve();
                    }
                }

                return generator.prompt({
                    type: 'list',
                    name: 'msProdValue',
                    message: 'Select a Microsoft Product value:',
                    choices: values,
                }).then(answers => {
                    generator.outputConfig.msProdValue = answers.msProdValue;
                });
            },
            askForQuestions: () => {
                return generator.prompt({
                    type: 'input',
                    name: 'knowledgeCheckQuestionCount',
                    message: 'How many questions:',
                    validate: validator.validateNonEmpty
                }).then(async answers => {
                    generator.outputConfig.knowledgeCheckQuestionCount = answers.knowledgeCheckQuestionCount;
                    generator.outputConfig.knowledgeCheckQuestions = [];

                    for (let questionIndex = 0; questionIndex < generator.outputConfig.knowledgeCheckQuestionCount; questionIndex += 1) {
                        const questionNumber = questionIndex + 1;
                        await generator.prompt([
                            { // Ask for question text
                                type: 'input',
                                name: 'questionContent',
                                message: '  Question ' + questionNumber + ' text:',
                                validate: validator.validateNonEmpty,
                            },
                            { // Ask how many answers
                                type: 'input',
                                name: 'questionAnswerCount',
                                message: '  Question ' + questionNumber + ' answer count:',
                                validate: validator.validateNonEmpty,
                            },
                        ]).then(async initialQuestionAnswers => {
                            // Pre-push questions into config before asking for values next
                            generator.outputConfig.knowledgeCheckQuestions.push({
                                questionIndex: questionIndex,
                                content: initialQuestionAnswers.questionContent,
                                answers: [],
                            });
        
                            for (let answerIndex = 0; answerIndex < initialQuestionAnswers.questionAnswerCount; answerIndex += 1) {
                                const answerNumber = answerIndex + 1;
                                await generator.prompt([
                                    {
                                        type: 'input',
                                        name: 'answerContent',
                                        message: '    Answer ' + answerNumber + ' text:',
                                        validate: validator.validateNonEmpty
                                    },
                                    {
                                        type: 'list',
                                        name: 'answerIsCorrect',
                                        message: '    Answer ' + answerNumber + ' is correct ("true" or "false")?:',
                                        validate: validator.validateBool,
                                        choices: [
                                            {
                                                value: "true"
                                            },
                                            {
                                                value: "false"
                                            }
                                        ]
                                    },
                                    {
                                        type: 'input',
                                        name: 'answerExplanation',
                                        message: '    Answer ' + answerNumber + ' explanation?:',
                                        validate: validator.validateNonEmpty
                                    },
                                ]).then(answerDetails => {
                                    const question = generator.outputConfig.knowledgeCheckQuestions[questionIndex];
                                    question.answers.push({
                                        content: answerDetails.answerContent,
                                        isCorrect: answerDetails.answerIsCorrect,
                                        explanation: answerDetails.answerExplanation
                                    });
                                });
                            }
                        });
                    }
                });
            },
        };

        // Ask prompt system borrowed from VS Code extension generator.
        // Run all prompts in sequence. Results can be ignored.
        let result = Promise.resolve();
        for (let taskName in prompts) {
            let prompt = prompts[taskName];
            result = result.then(_ => {
                return new Promise((s, r) => {
                    setTimeout(_ => prompt().then(s, r), 0); // set timeout is required, otherwise node hangs
                });
            })
        }
        return result;
    }

    writing() {
        this.sourceRoot(path.join(__dirname, './templates/knowledge-check'));
        this._writingKnowledgeCheck();
    }

    _writingKnowledgeCheck() {
        // Set up context for `copyTpl` template values.
        let context = this.outputConfig;

        this.fs.copyTpl(this.sourceRoot() + '/00-knowledge-check.yml', context.unitNumber + '-knowledge-check.yml', context);
    }
};
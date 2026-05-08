import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getGithubGistBaseURL } from '@/utils/gist';

describe('Gist GitHub API URL', function () {
    it('uses the default GitHub API URL when unset', function () {
        expect(getGithubGistBaseURL()).to.equal('https://api.github.com');
    });

    it('uses the default GitHub API URL when blank', function () {
        expect(
            getGithubGistBaseURL({
                githubApiUrl: '   ',
            }),
        ).to.equal('https://api.github.com');
    });

    it('applies GitHub proxy only to the default GitHub API URL', function () {
        expect(
            getGithubGistBaseURL({
                githubProxy: 'https://proxy.example.com/',
            }),
        ).to.equal('https://proxy.example.com/https://api.github.com');
    });

    it('does not apply GitHub proxy to a custom GitHub API URL', function () {
        expect(
            getGithubGistBaseURL({
                githubApiUrl: 'https://litegist.example.com/api/',
                githubProxy: 'https://proxy.example.com/',
            }),
        ).to.equal('https://litegist.example.com/api');
    });
});

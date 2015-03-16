var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var Q = require('q');
var BigBed = require('../src/BigBed');

describe('BigBed', function() {
  function getTestBigBed() {
    // This file was generated using UCSC tools:
    // cd kent/src/utils/bedToBigBed/tests; make
    // It is compressed, little endian, has autoSQL and two blocks.
    return new BigBed('/test/data/itemRgb.bb');
  }

  it('should extract features in a range', function(done) {
    var bb = getTestBigBed();

    bb.getFeaturesInRange('chrX', 151077036, 151078532)
        .then(features => {
          // Here's what these two lines in the file look like:
          // chrX 151077031 151078198 MID_BLUE 0 - 151077031 151078198 0,0,128
          // chrX 151078198 151079365 VIOLET_RED1 0 - 151078198 151079365 255,62,150
          expect(features).to.have.length(2);
          expect(features[0].contig).to.equal('chrX');
          expect(features[0].start).to.equal(151077031);
          expect(features[0].stop).to.equal(151078198);
          expect(features[1].contig).to.equal('chrX');
          expect(features[1].start).to.equal(151078198);
          expect(features[1].stop).to.equal(151079365);

          var rest0 = features[0].rest.split('\t');
          expect(rest0).to.have.length(6)
          expect(rest0[0]).to.equal('MID_BLUE');
          expect(rest0[2]).to.equal('-');
          expect(rest0[5]).to.equal('0,0,128');

          var rest1 = features[1].rest.split('\t');
          expect(rest1).to.have.length(6)
          expect(rest1[0]).to.equal('VIOLET_RED1');
          expect(rest1[2]).to.equal('-');
          expect(rest1[5]).to.equal('255,62,150');
          done();
        })
        .done();
  });

  it('should have inclusive ranges', function(done) {
    // The matches looks like this:
    // chrX 151071196 151072363 RED
    // chrX 151094536 151095703 PeachPuff
    var red = [151071196, 151072362],  // note: stop is inclusive
        peachpuff = [151094536, 151095702];

    var bb = getTestBigBed();
    var expectN = n => features => {
        expect(features).to.have.length(n);
      };

    Q.all([
        // request for precisely one row from the file.
        bb.getFeaturesInRange('chrX', red[0], red[1])
            .then(expectN(1)),
        // the additional base in the range hits another row.
        bb.getFeaturesInRange('chrX', red[0], 1 + red[1])
            .then(expectN(2)),
        // this overlaps exactly one base pair of the first feature.
        bb.getFeaturesInRange('chrX', red[0] - 1000, red[0])
            .then(expectN(1)),
        // but this range ends one base pair before it.
        bb.getFeaturesInRange('chrX', red[0] - 1000, red[0] - 1)
            .then(expectN(0))
    ]).then(() => {
      done();
    }).done();
  });

  it('should add "chr" to contig names', function(done) {
    var bb = getTestBigBed();

    bb.getFeaturesInRange('X', 151077036, 151078532)
        .then(features => {
          // (same as 'should extract features in a range' test)
          expect(features).to.have.length(2);
          expect(features[0].contig).to.equal('chrX');
          expect(features[1].contig).to.equal('chrX');
          done();
        })
        .done();
  });

  // Things left to test:
  // - getFeatures which crosses a block boundary
  // - uncompressed bigBed file.
});

